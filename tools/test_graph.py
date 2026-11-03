import contextlib
import io
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import graph  # noqa: E402

REPO = Path(__file__).resolve().parent.parent


def node_text(node_id, title, type_="option"):
    return f'---\nid: "{node_id}"\ntitle: {title}\ntype: {type_}\nsources: [user]\n---\nBody.\n'


class GraphTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.dir = Path(self._tmp.name) / "graph"
        self.dir.mkdir()
        # root, decision, two options
        self.add("aaaa0001", "Root", "root")
        self.add("aaaa0002", "Drive type", "decision")
        self.add("aaaa0003", "GT2 belt")
        self.add("aaaa0004", "Leadscrew")
        self.run_ok("link", "aaaa0002", "--parent", "aaaa0001")
        self.run_ok("link", "aaaa0003", "--parent", "aaaa0002")
        self.run_ok("link", "aaaa0004", "--parent", "aaaa0002")

    def add(self, node_id, title, type_="option"):
        (self.dir / f"{node_id}.md").write_text(node_text(node_id, title, type_))

    def run_cmd(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stderr(err):
            code = graph.main(["--graph-dir", str(self.dir), *argv], out)
        return code, out.getvalue(), err.getvalue()

    def run_ok(self, *argv):
        code, out, err = self.run_cmd(*argv)
        self.assertEqual(code, 0, err)
        return out

    def links_text(self):
        path = self.dir / "links.jsonl"
        return path.read_text() if path.exists() else ""

    def links(self):
        return [json.loads(l) for l in self.links_text().splitlines()]

    def files(self):
        return sorted(p.name for p in self.dir.glob("*.md"))

    # -- Link editing ---------------------------------------------------------

    def test_links_are_canonical(self):
        lines = self.links_text().splitlines()
        self.assertEqual(lines, sorted(lines))
        self.assertEqual(
            lines[0],
            '{"from":"aaaa0002","to":"aaaa0001","type":"parent","src":"user","hint":"Drive type > Root"}',
        )

    def test_add_second_parent_keeps_sorted(self):
        self.add("aaaa0005", "Low-cost build", "decision")
        self.run_ok("link", "aaaa0005", "--parent", "aaaa0001", "--src", "LLM:test")
        self.run_ok("link", "aaaa0003", "--parent", "aaaa0005")
        parents = [l["to"] for l in self.links() if l["type"] == "parent" and l["from"] == "aaaa0003"]
        self.assertEqual(parents, ["aaaa0002", "aaaa0005"])
        lines = self.links_text().splitlines()
        self.assertEqual(lines, sorted(lines, key=lambda t: (json.loads(t)["type"], json.loads(t)["from"], json.loads(t)["to"])))
        self.assertIn('"src":"LLM:test"', self.links_text())

    def test_cycle_refused(self):
        before = self.links_text()
        code, _, err = self.run_cmd("link", "aaaa0002", "--parent", "aaaa0003")
        self.assertEqual(code, 1)
        self.assertIn("cycle", err)
        self.assertEqual(self.links_text(), before)

    def test_duplicate_and_self_refused(self):
        before = self.links_text()
        self.assertEqual(self.run_cmd("link", "aaaa0003", "--parent", "aaaa0002")[0], 1)
        self.assertEqual(self.run_cmd("link", "aaaa0003", "--requires", "aaaa0003")[0], 1)
        self.assertEqual(self.links_text(), before)

    def test_remove_link_leaves_others(self):
        self.run_ok("link", "aaaa0003", "--requires", "aaaa0004")
        before = self.links_text().splitlines()
        self.run_ok("unlink", "aaaa0003", "--requires", "aaaa0004")
        self.assertEqual(self.links_text().splitlines(), [l for l in before if '"requires"' not in l])
        self.assertEqual(self.run_cmd("unlink", "aaaa0003", "--requires", "aaaa0004")[0], 1)

    def test_prefix_and_ambiguity(self):
        self.run_ok("link", "aaaa0003", "--excludes", "aaaa0004")
        code, _, err = self.run_cmd("link", "aaaa000", "--requires", "aaaa0001")
        self.assertEqual(code, 1)
        self.assertIn("aaaa0001", err)
        self.assertIn("aaaa0004", err)
        self.add("bbbb0001", "Unique")
        self.run_ok("link", "bbbb", "--parent", "aaaa0001")
        self.assertEqual(self.run_cmd("link", "zz", "--parent", "aaaa0001")[0], 1)

    # -- Node creation --------------------------------------------------------

    def test_new_option_under_decision(self):
        new_id = self.run_ok("new", "Rack and pinion", "--parent", "aaaa0002").strip()
        self.assertRegex(new_id, r"^[0-9a-f]{8}$")
        text = (self.dir / "rack-and-pinion.md").read_text()
        self.assertIn(f'id: "{new_id}"', text)
        self.assertIn('sources: ["user"]', text)
        self.assertIn({"from": new_id, "to": "aaaa0002", "type": "parent", "src": "user", "hint": "Rack and pinion > Drive type"}, self.links())

    def test_new_name_collision_gets_suffix(self):
        self.run_ok("new", "Same", "--parent", "aaaa0002")
        self.run_ok("new", "Same", "--parent", "aaaa0002")
        self.assertIn("same.md", self.files())
        self.assertIn("same-2.md", self.files())

    def test_new_two_parents_and_options(self):
        new_id = self.run_ok(
            "new", "Both", "--parent", "aaaa0002", "--parent", "aaaa0001", "--source", "u", "--source", "LLM:x",
            "--confidence", "low", "--slot", "Motion",
        ).strip()
        text = (self.dir / "both.md").read_text()
        for expected in ('sources: ["u", "LLM:x"]', "confidence: low", "slot: Motion"):
            self.assertIn(expected, text)
        self.assertEqual(len([l for l in self.links() if l["from"] == new_id]), 2)

    def test_new_missing_or_unknown_parent_writes_nothing(self):
        before_links, before_files = self.links_text(), self.files()
        code, _, err = self.run_cmd("new", "Nope")
        self.assertEqual(code, 1)
        code, _, err = self.run_cmd("new", "Nope", "--parent", "deadbeef")
        self.assertEqual(code, 1)
        self.assertIn("deadbeef", err)
        self.assertEqual((self.links_text(), self.files()), (before_links, before_files))

    def test_new_second_root_refused(self):
        self.assertEqual(self.run_cmd("new", "Another", "--type", "root")[0], 1)

    # -- Hints and format -----------------------------------------------------

    def test_format_refreshes_hints_only(self):
        self.add("aaaa0003", "Belt, renamed")
        before = self.links_text().splitlines()
        self.run_ok("format")
        after = self.links_text().splitlines()
        self.assertEqual(len(before), len(after))
        changed = [(b, a) for b, a in zip(before, after) if b != a]
        self.assertEqual(len(changed), 1)
        self.assertIn("Belt, renamed > Drive type", changed[0][1])
        self.assertEqual(json.loads(changed[0][0])["from"], json.loads(changed[0][1])["from"])

    def test_format_fixes_order_and_keys(self):
        (self.dir / "links.jsonl").write_text(
            '{"type":"parent","src":"x","to":"aaaa0001","from":"aaaa0004"}\n'
            '{"type":"parent","src":"x","to":"aaaa0001","from":"aaaa0002"}\n'
        )
        self.run_ok("format")
        self.assertEqual(
            self.links_text(),
            '{"from":"aaaa0002","to":"aaaa0001","type":"parent","src":"x","hint":"Drive type > Root"}\n'
            '{"from":"aaaa0004","to":"aaaa0001","type":"parent","src":"x","hint":"Leadscrew > Root"}\n',
        )

    # -- Tree -----------------------------------------------------------------

    def test_tree_two_parents(self):
        self.run_ok("new", "Under belt", "--parent", "aaaa0003")
        self.add("aaaa0005", "Another decision", "decision")
        self.run_ok("link", "aaaa0005", "--parent", "aaaa0001")
        self.run_ok("link", "aaaa0003", "--parent", "aaaa0005")
        lines = self.run_ok("tree").splitlines()
        self.assertEqual(lines[0], "aaaa0001 Root")
        self.assertEqual(lines[1], "  aaaa0005 Another decision")
        self.assertEqual(lines[2], "    aaaa0003 GT2 belt")
        self.assertTrue(lines[3].strip().endswith("Under belt"))
        self.assertIn("aaaa0003 GT2 belt (repeated)", "\n".join(lines))
        self.assertEqual(sum("Under belt" in l for l in lines), 1)

    # -- Lint -----------------------------------------------------------------

    def test_lint_clean(self):
        code, out, _ = self.run_cmd("lint")
        self.assertEqual((code, out), (0, ""))

    def test_lint_redundant_parent(self):
        self.run_ok("link", "aaaa0003", "--parent", "aaaa0001")
        code, out, _ = self.run_cmd("lint")
        self.assertEqual(code, 1)
        self.assertEqual(len(out.splitlines()), 1)
        self.assertIn("redundant parent link: aaaa0003 GT2 belt -> aaaa0001 Root", out)

    def test_lint_contradiction_parentless_and_stale(self):
        self.run_ok("link", "aaaa0003", "--requires", "aaaa0004")
        self.run_ok("link", "aaaa0004", "--excludes", "aaaa0003")
        self.add("aaaa0009", "Loose")
        self.add("aaaa0003", "Renamed")
        before = self.links_text()
        code, out, _ = self.run_cmd("lint")
        self.assertEqual(code, 1)
        self.assertIn("requires and excludes on the same pair", out)
        self.assertIn("node without a parent: aaaa0009 Loose", out)
        self.assertIn("stale hint", out)
        self.assertEqual(self.links_text(), before)

    # -- The Node build accepts what the tool writes --------------------------

    def test_node_build_accepts_tool_output(self):
        new_id = self.run_ok("new", "Rack", "--parent", "aaaa0002", "--parent", "aaaa0001").strip()
        self.run_ok("link", new_id, "--excludes", "aaaa0003")
        out = Path(self._tmp.name) / "graph.json"
        result = subprocess.run(
            ["node", str(REPO / "scripts/build-graph.mjs"), str(self.dir), str(out)], capture_output=True, text=True
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        by_id = {n["id"]: n for n in json.loads(out.read_text())["nodes"]}
        self.assertEqual(by_id[new_id]["parents"], ["aaaa0001", "aaaa0002"])
        self.assertEqual(by_id["aaaa0003"]["excludes"], [new_id])


if __name__ == "__main__":
    unittest.main()
