#!/usr/bin/env python3
"""Edit the design graph: create nodes, add and remove links, print the tree, lint.

Standard library only. Nodes are graph/**/*.md (frontmatter `id` and `title` are read
here); links live in graph/links.jsonl, which only this tool writes, in canonical form.
The Node build (scripts/build-graph.mjs) stays the full validator.
"""
import argparse
import json
import re
import secrets
import sys
from pathlib import Path

LINK_TYPES = ("parent", "requires", "excludes", "compatible_with")
NODE_TYPES = ("root", "decision", "option", "component")
CONFIDENCES = ("low", "medium", "high")
KEY_ORDER = ("from", "to", "type", "src", "hint")
DEFAULT_GRAPH_DIR = Path(__file__).resolve().parent.parent / "graph"


class GraphError(Exception):
    pass


# ---- reading nodes and links ------------------------------------------------

def _scalar(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        try:
            return json.loads(value) if value[0] == '"' else value[1:-1]
        except ValueError:
            return value[1:-1]
    return value


def read_frontmatter(path):
    """Return the top-level `id`, `title` and `type` scalars of a node file (line scan, no YAML)."""
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        raise GraphError(f"{path.name}: missing frontmatter")
    found = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        m = re.match(r"(id|title|type):\s*(.*)$", line)
        if m:
            found[m.group(1)] = _scalar(m.group(2))
    return found


def read_nodes(graph_dir):
    """Return {id: {"id", "title", "path"}}."""
    nodes = {}
    for path in sorted(graph_dir.rglob("*.md")):
        meta = read_frontmatter(path)
        node_id = meta.get("id")
        if not node_id:
            raise GraphError(f"{path.relative_to(graph_dir)}: no id in frontmatter")
        if node_id in nodes:
            raise GraphError(f"duplicate id {node_id} in {path.relative_to(graph_dir)} and {nodes[node_id]['path'].relative_to(graph_dir)}")
        nodes[node_id] = {"id": node_id, "title": meta.get("title", node_id), "type": meta.get("type"), "path": path}
    return nodes


def read_links(graph_dir):
    path = graph_dir / "links.jsonl"
    if not path.exists():
        return []
    links = []
    for number, text in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not text.strip():
            continue
        try:
            link = json.loads(text)
            if not isinstance(link, dict) or not all(isinstance(link.get(k), str) for k in ("from", "to", "type", "src")):
                raise ValueError
        except ValueError:
            raise GraphError(f"links.jsonl:{number}: not a valid link line")
        links.append(link)
    return links


def sort_key(link):
    return (link["type"], link["from"], link["to"])


def hint_for(link, nodes):
    a = nodes[link["from"]]["title"]
    b = nodes[link["to"]]["title"]
    return f"{a} > {b}" if link["type"] == "parent" else f"{a} {link['type']} {b}"


def canonical_line(link):
    ordered = {k: link[k] for k in KEY_ORDER if k in link}
    return json.dumps(ordered, separators=(",", ":"), ensure_ascii=False)


def write_links(graph_dir, links, nodes):
    """Write links.jsonl sorted, in canonical key order, with every hint refreshed."""
    out = []
    for link in sorted(links, key=sort_key):
        for end in ("from", "to"):
            if link[end] not in nodes:
                raise GraphError(f"link {link['type']} {link['from']} -> {link['to']}: unknown node {link[end]}")
        out.append({**link, "hint": hint_for(link, nodes)})
    text = "".join(canonical_line(link) + "\n" for link in out)
    (graph_dir / "links.jsonl").write_text(text, encoding="utf-8")


# ---- helpers ----------------------------------------------------------------

def resolve(ref, nodes):
    if ref in nodes:
        return ref
    matches = sorted(i for i in nodes if i.startswith(ref)) if ref else []
    if not matches:
        raise GraphError(f"unknown node: {ref}")
    if len(matches) > 1:
        raise GraphError(f"ambiguous node {ref}: matches " + ", ".join(matches))
    return matches[0]


def parents_of(links):
    parents = {}
    for link in links:
        if link["type"] == "parent":
            parents.setdefault(link["from"], []).append(link["to"])
    return parents


def ancestors(node_id, parents):
    seen, stack = set(), list(parents.get(node_id, []))
    while stack:
        cur = stack.pop()
        if cur not in seen:
            seen.add(cur)
            stack.extend(parents.get(cur, []))
    return seen


def title_key(nodes):
    return lambda i: (nodes[i]["title"].lower(), i)


def label(node_id, nodes):
    return f"{node_id} {nodes[node_id]['title']}"


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "node"


def yaml_scalar(text):
    plain = re.fullmatch(r"[A-Za-z][A-Za-z0-9 .()+/_-]*", text) and text.lower() not in ("yes", "no", "true", "false", "null", "on", "off")
    return text if plain else json.dumps(text, ensure_ascii=False)


# ---- commands ---------------------------------------------------------------

def link_args(args):
    """Yield (type, target reference) from the repeated --parent/--requires/... options."""
    for t in LINK_TYPES:
        for ref in getattr(args, t) or []:
            yield t, ref


def cmd_link(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    src = resolve(args.node, nodes)
    wanted = [(t, resolve(ref, nodes)) for t, ref in link_args(args)]
    if not wanted:
        raise GraphError("nothing to link: give --parent, --requires, --excludes or --compatible-with")
    for t, dst in wanted:
        if src == dst:
            raise GraphError(f"{src}: cannot link a node to itself")
        if any(sort_key(l) == (t, src, dst) for l in links):
            raise GraphError(f"link already exists: {t} {src} -> {dst}")
        if t == "parent" and src in ancestors(dst, parents_of(links)) | {dst}:
            raise GraphError(f"parent link {src} -> {dst} would create a cycle")
        links.append({"from": src, "to": dst, "type": t, "src": args.src})
    write_links(graph_dir, links, nodes)
    for t, dst in wanted:
        print(f"added {t}: {label(src, nodes)} -> {label(dst, nodes)}", file=out)


def cmd_unlink(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    src = resolve(args.node, nodes)
    wanted = [(t, resolve(ref, nodes)) for t, ref in link_args(args)]
    if not wanted:
        raise GraphError("nothing to unlink: give --parent, --requires, --excludes or --compatible-with")
    for t, dst in wanted:
        keep = [l for l in links if sort_key(l) != (t, src, dst)]
        if len(keep) == len(links):
            raise GraphError(f"no such link: {t} {src} -> {dst}")
        links = keep
    write_links(graph_dir, links, nodes)
    for t, dst in wanted:
        print(f"removed {t}: {label(src, nodes)} -> {label(dst, nodes)}", file=out)


def cmd_new(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    title = args.title.strip()
    if not title:
        raise GraphError("title must not be empty")
    parent_ids = [resolve(ref, nodes) for ref in args.parent or []]
    if args.type == "root":
        if parent_ids:
            raise GraphError("the root node has no parent")
        if any(n["type"] == "root" for n in nodes.values()):
            raise GraphError("the graph already has a root node")
    elif not parent_ids:
        raise GraphError(f"a {args.type} node needs at least one --parent")
    while True:
        new_id = secrets.token_hex(4)
        if new_id not in nodes:
            break
    slug = slugify(title)
    path, n = graph_dir / f"{slug}.md", 2
    while path.exists():
        path, n = graph_dir / f"{slug}-{n}.md", n + 1
    fields = [f'id: "{new_id}"', f"title: {yaml_scalar(title)}", f"type: {args.type}"]
    if args.slot:
        fields.append(f"slot: {yaml_scalar(args.slot)}")
    fields.append("sources: " + json.dumps(args.source or ["user"], ensure_ascii=False))
    if args.confidence:
        fields.append(f"confidence: {args.confidence}")
    graph_dir.mkdir(parents=True, exist_ok=True)
    path.write_text("---\n" + "\n".join(fields) + "\n---\n", encoding="utf-8")
    nodes[new_id] = {"id": new_id, "title": title, "type": args.type, "path": path}
    links += [{"from": new_id, "to": p, "type": "parent", "src": args.src} for p in parent_ids]
    write_links(graph_dir, links, nodes)
    print(new_id, file=out)


def cmd_tree(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    parents = parents_of(links)
    children = {}
    for child, ps in parents.items():
        for p in ps:
            if child in nodes and p in nodes:
                children.setdefault(p, []).append(child)
    key = title_key(nodes)
    printed = set()

    def walk(node_id, depth):
        again = node_id in printed
        print("  " * depth + label(node_id, nodes) + (" (repeated)" if again else ""), file=out)
        if again:
            return
        printed.add(node_id)
        for child in sorted(children.get(node_id, []), key=key):
            walk(child, depth + 1)

    for top in sorted((i for i in nodes if not parents.get(i)), key=key):
        walk(top, 0)


def cmd_format(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    seen = set()
    unique = []
    for link in links:
        if sort_key(link) not in seen:
            seen.add(sort_key(link))
            unique.append(link)
    write_links(graph_dir, unique, nodes)
    print(f"wrote links.jsonl ({len(unique)} links)", file=out)


def cmd_lint(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    findings = []
    known = [l for l in links if l["from"] in nodes and l["to"] in nodes]
    for l in links:
        for end in ("from", "to"):
            if l[end] not in nodes:
                findings.append(f"unknown node {l[end]} in {l['type']} link {l['from']} -> {l['to']}")
    parents = parents_of(known)
    for l in sorted((l for l in known if l["type"] == "parent"), key=sort_key):
        for other in parents[l["from"]]:
            if other != l["to"] and l["to"] in ancestors(other, parents):
                findings.append(
                    f"redundant parent link: {label(l['from'], nodes)} -> {label(l['to'], nodes)} "
                    f"(already implied via {label(other, nodes)})"
                )
                break
    for i in sorted(nodes, key=title_key(nodes)):
        if nodes[i]["type"] != "root" and not parents.get(i):
            findings.append(f"node without a parent: {label(i, nodes)}")
    pairs = {(l["from"], l["to"]) for l in known if l["type"] == "requires"}
    for l in sorted((l for l in known if l["type"] == "excludes"), key=sort_key):
        if (l["from"], l["to"]) in pairs or (l["to"], l["from"]) in pairs:
            findings.append(f"requires and excludes on the same pair: {label(l['from'], nodes)} / {label(l['to'], nodes)}")
    for l in sorted(known, key=sort_key):
        if l.get("hint") != hint_for(l, nodes):
            findings.append(f"stale hint on {l['type']} {l['from']} -> {l['to']}: expected \"{hint_for(l, nodes)}\"")
    for f in findings:
        print(f, file=out)
    return 1 if findings else 0


# ---- command line -----------------------------------------------------------

def build_parser():
    p = argparse.ArgumentParser(prog="graph.py", description=__doc__.split("\n")[0])
    p.add_argument("--graph-dir", type=Path, default=DEFAULT_GRAPH_DIR, help="graph folder (default: ./graph of this repo)")
    sub = p.add_subparsers(dest="command", required=True)

    def add_link_options(sp):
        for t in LINK_TYPES:
            sp.add_argument(f"--{t.replace('_', '-')}", dest=t, action="append", metavar="ID", help=f"{t} target (repeatable)")

    s = sub.add_parser("new", help="create a node and print its id")
    s.add_argument("title")
    s.add_argument("--type", choices=NODE_TYPES, default="option")
    s.add_argument("--parent", action="append", metavar="ID", help="parent node (repeatable)")
    s.add_argument("--source", action="append", help="node source (repeatable, default: user)")
    s.add_argument("--confidence", choices=CONFIDENCES)
    s.add_argument("--slot")
    s.add_argument("--src", default="user", help="provenance recorded on the parent links")
    s.set_defaults(run=cmd_new)

    s = sub.add_parser("link", help="add links from a node")
    s.add_argument("node")
    add_link_options(s)
    s.add_argument("--src", default="user", help="provenance recorded on the links (default: user)")
    s.set_defaults(run=cmd_link)

    s = sub.add_parser("unlink", help="remove links from a node")
    s.add_argument("node")
    add_link_options(s)
    s.set_defaults(run=cmd_unlink)

    sub.add_parser("tree", help="print the hierarchy").set_defaults(run=cmd_tree)
    sub.add_parser("format", help="rewrite links.jsonl in canonical form, refreshing hints").set_defaults(run=cmd_format)
    sub.add_parser("lint", help="report graph hygiene findings (exit 1 if any)").set_defaults(run=cmd_lint)
    return p


def main(argv=None, out=None):
    out = out or sys.stdout
    args = build_parser().parse_args(argv)
    try:
        return args.run(args, args.graph_dir, out) or 0
    except GraphError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
