#!/usr/bin/env python3
"""Edit the design graph: create nodes, add and remove links, print the tree, lint.

Standard library only. Nodes are graph/*.md (frontmatter `id`, `title` and `type` are read
here); links live in graph/links.jsonl, which only this tool writes, in canonical form.
The Node build (scripts/build-graph.mjs) stays the full validator.
"""
import argparse
import json
import re
import secrets
import sys
from pathlib import Path

LINK_TYPES = ("how", "constrains", "requires", "excludes", "compatible_with", "fares")
NODE_TYPES = ("function", "solution", "component", "constraint")
HOW_PAIRS = (("function", "function"), ("function", "solution"), ("solution", "function"), ("solution", "component"))
SELECTABLE = ("solution", "component")
CONFIDENCES = ("low", "medium", "high")
KEY_ORDER = ("from", "to", "type", "order", "score", "src", "hint")
SCORES = (-2, -1, 1, 2)
SUMMARY_MAX = 120
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
    """Return the top-level `id`, `title`, `type` and `summary` scalars of a node file (line scan, no YAML)."""
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        raise GraphError(f"{path.name}: missing frontmatter")
    found = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        m = re.match(r"(id|title|type|summary):\s*(.*)$", line)
        if m:
            found[m.group(1)] = _scalar(m.group(2))
    return found


def read_nodes(graph_dir):
    """Return {id: {"id", "title", "path"}}."""
    nodes = {}
    for path in sorted(graph_dir.glob("*.md")):
        meta = read_frontmatter(path)
        node_id = meta.get("id")
        if not node_id:
            raise GraphError(f"{path.relative_to(graph_dir)}: no id in frontmatter")
        if node_id in nodes:
            raise GraphError(f"duplicate id {node_id} in {path.relative_to(graph_dir)} and {nodes[node_id]['path'].relative_to(graph_dir)}")
        nodes[node_id] = {"id": node_id, "title": meta.get("title", node_id), "type": meta.get("type"), "summary": meta.get("summary"), "path": path}
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
    return f"{a} > {b}" if link["type"] == "how" else f"{a} {link['type']} {b}"


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


def whys_of(links):
    """{node: [why ids]} over the how links, in file order."""
    whys = {}
    for link in links:
        if link["type"] == "how":
            whys.setdefault(link["to"], []).append(link["from"])
    return whys


def hows_of(links):
    """{node: [how ids]} over the how links, in file order."""
    hows = {}
    for link in links:
        if link["type"] == "how":
            hows.setdefault(link["from"], []).append(link["to"])
    return hows


def ordered_hows(links, nodes):
    """{node: [how ids]} in author order: `order` ascending, then links without one by title and id (as the build)."""
    out = {}
    for link in links:
        if link["type"] == "how" and link["to"] in nodes:
            out.setdefault(link["from"], []).append(link)
    rank = lambda l: (l["order"] if isinstance(l.get("order"), int) else float("inf"), nodes[l["to"]]["title"].lower(), l["to"])
    return {p: [l["to"] for l in sorted(ls, key=rank)] for p, ls in out.items()}


def ancestors(node_id, whys):
    seen, stack = set(), list(whys.get(node_id, []))
    while stack:
        cur = stack.pop()
        if cur not in seen:
            seen.add(cur)
            stack.extend(whys.get(cur, []))
    return seen


def check_pair(link_type, a, b):
    """Raise GraphError when a link of this type may not join node types a and b."""
    ok = True
    if link_type == "how":
        ok = (a, b) in HOW_PAIRS
    elif link_type == "constrains":
        ok = (a, b) == ("constraint", "function")
    elif link_type == "fares":
        ok = a in SELECTABLE and b == "constraint"
    else:
        ok = a in SELECTABLE and b in SELECTABLE
    if not ok:
        raise GraphError(f"a {link_type} link from {a} to {b} is not allowed")


def check_mixed(nodes, hows, src, dst_type):
    """Raise GraphError when src (a function) would get both function and solution how targets."""
    if nodes[src]["type"] != "function":
        return
    kinds = {nodes[t]["type"] for t in hows.get(src, []) if t in nodes} | {dst_type}
    if "function" in kinds and "solution" in kinds:
        raise GraphError(f"{src}: a function's how targets must be all functions or all solutions")


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
    """Yield (type, target reference) from the repeated --how/--requires/... options."""
    for t in LINK_TYPES:
        for ref in getattr(args, t) or []:
            yield t, ref


def cmd_link(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    src = resolve(args.node, nodes)
    wanted = [(t, resolve(ref, nodes)) for t, ref in link_args(args)]
    if not wanted:
        raise GraphError("nothing to link: give --how, --constrains, --requires, --excludes, --compatible-with or --fares")
    if args.order is not None and [t for t, _ in wanted] != ["how"]:
        raise GraphError("--order goes with exactly one --how link")
    fares = [t for t, _ in wanted if t == "fares"]
    if fares and args.score not in SCORES:
        raise GraphError("--fares needs --score -2, -1, 1 or 2")
    if args.score is not None and not fares:
        raise GraphError("--score goes with --fares")
    for t, dst in wanted:
        if src == dst:
            raise GraphError(f"{src}: cannot link a node to itself")
        if t == "fares":
            check_pair(t, nodes[src]["type"], nodes[dst]["type"])
            links = [l for l in links if sort_key(l) != (t, src, dst)]  # linking again rescores
            links.append({"from": src, "to": dst, "type": t, "score": args.score, "src": args.src})
            continue
        if any(sort_key(l) == (t, src, dst) for l in links):
            raise GraphError(f"link already exists: {t} {src} -> {dst}")
        check_pair(t, nodes[src]["type"], nodes[dst]["type"])
        if t == "how":
            if dst in ancestors(src, whys_of(links)):
                raise GraphError(f"how link {src} -> {dst} would create a cycle")
            check_mixed(nodes, hows_of(links), src, nodes[dst]["type"])
        new = {"from": src, "to": dst, "type": t, "src": args.src}
        if t == "how" and args.order is not None:
            new = {**new, "order": args.order}
        links.append(new)
    write_links(graph_dir, links, nodes)
    for t, dst in wanted:
        print(f"added {t}: {label(src, nodes)} -> {label(dst, nodes)}", file=out)


def cmd_unlink(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    src = resolve(args.node, nodes)
    wanted = [(t, resolve(ref, nodes)) for t, ref in link_args(args)]
    if not wanted:
        raise GraphError("nothing to unlink: give --how, --constrains, --requires, --excludes, --compatible-with or --fares")
    for t, dst in wanted:
        keep = [l for l in links if sort_key(l) != (t, src, dst)]
        if len(keep) == len(links):
            raise GraphError(f"no such link: {t} {src} -> {dst}")
        links = keep
    write_links(graph_dir, links, nodes)
    for t, dst in wanted:
        print(f"removed {t}: {label(src, nodes)} -> {label(dst, nodes)}", file=out)


def cmd_order(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    parent = resolve(args.parent, nodes)
    children = [resolve(ref, nodes) for ref in args.children]
    if len(set(children)) != len(children):
        raise GraphError("a child is listed twice")
    actual = {l["to"] for l in links if l["type"] == "how" and l["from"] == parent}
    for c in children:
        if c not in actual:
            raise GraphError(f"{label(c, nodes)} is not a how child of {label(parent, nodes)}")
    position = {c: n for n, c in enumerate(children, 1)}
    updated = []
    for l in links:
        if l["type"] == "how" and l["from"] == parent:
            l = {k: v for k, v in l.items() if k != "order"}
            if l["to"] in position:
                l["order"] = position[l["to"]]
        updated.append(l)
    write_links(graph_dir, updated, nodes)
    print(f"ordered {len(children)} of {len(actual)} children of {label(parent, nodes)}", file=out)


def roots_of(nodes, links):
    whys = whys_of(links)
    return [i for i in nodes if nodes[i]["type"] == "function" and not whys.get(i)]


def cmd_new(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    title = args.title.strip()
    if not title:
        raise GraphError("title must not be empty")
    summary = args.summary
    if summary is not None and ("\n" in summary or "\r" in summary or len(summary) > SUMMARY_MAX):
        raise GraphError(f"summary must be a single line of at most {SUMMARY_MAX} characters")
    why_ids = [resolve(ref, nodes) for ref in args.why or []]
    constrains_ids = [resolve(ref, nodes) for ref in args.constrains or []]
    if args.type == "constraint":
        if why_ids:
            raise GraphError("a constraint has no --why, use --constrains")
        if not constrains_ids:
            raise GraphError("a constraint needs at least one --constrains <function>")
        for f in constrains_ids:
            check_pair("constrains", "constraint", nodes[f]["type"])
    else:
        if constrains_ids:
            raise GraphError("--constrains is only for constraint nodes")
        if not why_ids:
            if args.type != "function" or roots_of(nodes, links):
                raise GraphError(f"a {args.type} node needs at least one --why" if args.type != "function" else "the graph already has a root function: give --why")
        hows = hows_of(links)
        for w in why_ids:
            check_pair("how", nodes[w]["type"], args.type)
            check_mixed(nodes, hows, w, args.type)
    while True:
        new_id = secrets.token_hex(4)
        if new_id not in nodes:
            break
    slug = slugify(title)
    path, n = graph_dir / f"{slug}.md", 2
    while path.exists():
        path, n = graph_dir / f"{slug}-{n}.md", n + 1
    fields = [f'id: "{new_id}"', f"title: {yaml_scalar(title)}", f"type: {args.type}"]
    fields.append("sources: " + json.dumps(args.source or ["user"], ensure_ascii=False))
    if args.confidence:
        fields.append(f"confidence: {args.confidence}")
    if summary:
        fields.append(f"summary: {yaml_scalar(summary)}")
    graph_dir.mkdir(parents=True, exist_ok=True)
    path.write_text("---\n" + "\n".join(fields) + "\n---\n", encoding="utf-8")
    nodes[new_id] = {"id": new_id, "title": title, "type": args.type, "path": path}
    links += [{"from": w, "to": new_id, "type": "how", "src": args.src} for w in why_ids]
    links += [{"from": new_id, "to": f, "type": "constrains", "src": args.src} for f in constrains_ids]
    write_links(graph_dir, links, nodes)
    print(new_id, file=out)


def cmd_tree(args, graph_dir, out):
    nodes, links = read_nodes(graph_dir), read_links(graph_dir)
    hows = {p: cs for p, cs in ordered_hows(links, nodes).items() if p in nodes}
    constraints = {}
    for l in links:
        if l["type"] == "constrains" and l["from"] in nodes and l["to"] in nodes:
            constraints.setdefault(l["to"], []).append(l["from"])
    key = title_key(nodes)
    printed = set()

    def tag(parent_id, node_id):
        kind = nodes[node_id]["type"]
        if kind == "solution":
            return " [OR]"
        if kind == "function":
            return " [AND]"
        return " [part]" if nodes[parent_id]["type"] == "solution" else ""

    def walk(node_id, depth, suffix):
        again = node_id in printed
        print("  " * depth + label(node_id, nodes) + suffix + (" (repeated)" if again else ""), file=out)
        if again:
            return
        printed.add(node_id)
        for child in hows.get(node_id, []):
            walk(child, depth + 1, tag(node_id, child))
        for c in sorted(constraints.get(node_id, []), key=key):
            print("  " * (depth + 1) + label(c, nodes) + " [constraint]", file=out)

    for top in sorted(roots_of(nodes, links), key=key):
        walk(top, 0, "")


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
    whys, hows = whys_of(known), hows_of(known)
    for l in sorted((l for l in known if l["type"] == "how"), key=sort_key):
        for other in whys[l["to"]]:
            if other != l["from"] and l["from"] in ancestors(other, whys):
                findings.append(
                    f"redundant how link: {label(l['from'], nodes)} -> {label(l['to'], nodes)} "
                    f"(already implied via {label(other, nodes)})"
                )
                break
    reached, stack = set(), roots_of(nodes, known)
    while stack:
        cur = stack.pop()
        if cur not in reached:
            reached.add(cur)
            stack.extend(hows.get(cur, []))
    for i in sorted(nodes, key=title_key(nodes)):
        if nodes[i]["type"] not in ("constraint", None) and i not in reached:
            findings.append(f"unreachable from the root function: {label(i, nodes)}")
    for i in sorted(nodes, key=title_key(nodes)):
        kinds = {nodes[t]["type"] for t in hows.get(i, [])}
        if nodes[i]["type"] == "function" and "function" in kinds and "solution" in kinds:
            findings.append(f"function with both function and solution children: {label(i, nodes)}")
    for i in sorted(nodes, key=title_key(nodes)):
        ranks = [isinstance(l.get("order"), int) for l in known if l["type"] == "how" and l["from"] == i]
        if any(ranks) and not all(ranks):
            findings.append(f"partly ordered children (some how links have an order, some not): {label(i, nodes)}")
    constrainers = {l["from"] for l in known if l["type"] == "constrains"}
    for i in sorted(nodes, key=title_key(nodes)):
        if nodes[i]["type"] == "constraint" and i not in constrainers:
            findings.append(f"constraint without a constrains link: {label(i, nodes)}")
    for i in sorted(nodes, key=title_key(nodes)):
        if nodes[i]["type"] in SELECTABLE and not nodes[i]["summary"]:
            findings.append(f"{nodes[i]['type']} without a summary: {label(i, nodes)}")
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
    s.add_argument("--type", choices=NODE_TYPES, required=True)
    s.add_argument("--why", action="append", metavar="ID", help="node this one is a how of (repeatable; not for constraints)")
    s.add_argument("--constrains", action="append", metavar="ID", help="function a constraint limits (repeatable; constraints only)")
    s.add_argument("--source", action="append", help="node source (repeatable, default: user)")
    s.add_argument("--confidence", choices=CONFIDENCES)
    s.add_argument("--summary", metavar="TEXT", help=f"one-line description, at most {SUMMARY_MAX} characters")
    s.add_argument("--src", default="user", help="provenance recorded on the new links")
    s.set_defaults(run=cmd_new)

    s = sub.add_parser("link", help="add links from a node")
    s.add_argument("node")
    add_link_options(s)
    s.add_argument("--src", default="user", help="provenance recorded on the links (default: user)")
    s.add_argument("--order", type=int, metavar="N", help="position of a new --how link among its parent's children")
    s.add_argument("--score", type=int, metavar="N", help="score of a --fares link: -2, -1, 1 or 2 (linking again rescores)")
    s.set_defaults(run=cmd_link)

    s = sub.add_parser("unlink", help="remove links from a node")
    s.add_argument("node")
    add_link_options(s)
    s.set_defaults(run=cmd_unlink)

    s = sub.add_parser("order", help="set the order of a node's how children")
    s.add_argument("parent")
    s.add_argument("children", nargs="+", metavar="child", help="how children, first to last; unlisted children lose their order")
    s.set_defaults(run=cmd_order)

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
