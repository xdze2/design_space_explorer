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


def node_text(node_id, title, type_="solution"):
    return f'---\nid: "{node_id}"\ntitle: {title}\ntype: {type_}\nsources: [user]\n---\nBody.\n'


class GraphTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.dir = Path(self._tmp.name) / "graph"
        self.dir.mkdir()
        # main function, a sub-function with two solutions
        self.add("aaaa0001", "Main", "function")
        self.add("aaaa0002", "Drive", "function")
        self.add("aaaa0003", "GT2 belt")
        self.add("aaaa0004", "Leadscrew")
        self.run_ok("link", "aaaa0001", "--how", "aaaa0002")
        self.run_ok("link", "aaaa0002", "--how", "aaaa0003")
        self.run_ok("link", "aaaa0002", "--how", "aaaa0004")

    def add(self, node_id, title, type_="solution"):
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

    def assert_refused(self, *argv, mention=""):
        before = (self.links_text(), self.files())
        code, _, err = self.run_cmd(*argv)
        self.assertEqual(code, 1)
        self.assertIn(mention, err)
        self.assertEqual((self.links_text(), self.files()), before)

    # -- Link editing ---------------------------------------------------------

    def test_links_are_canonical(self):
        lines = self.links_text().splitlines()
        self.assertEqual(lines, sorted(lines))
        self.assertEqual(
            lines[0],
            '{"from":"aaaa0001","to":"aaaa0002","type":"how","src":"user","hint":"Main > Drive"}',
        )

    def test_add_second_why_keeps_sorted(self):
        self.add("aaaa0006", "Spare", "function")
        self.run_ok("link", "aaaa0003", "--how", "aaaa0006", "--src", "LLM:test")
        self.run_ok("link", "aaaa0004", "--how", "aaaa0006")
        whys = [l["from"] for l in self.links() if l["type"] == "how" and l["to"] == "aaaa0006"]
        self.assertEqual(whys, ["aaaa0003", "aaaa0004"])
        lines = self.links_text().splitlines()
        self.assertEqual(lines, sorted(lines, key=lambda t: (json.loads(t)["type"], json.loads(t)["from"], json.loads(t)["to"])))
        self.assertIn('"src":"LLM:test"', self.links_text())

    def test_cycle_refused(self):
        self.add("aaaa0006", "Sub", "function")
        self.run_ok("link", "aaaa0003", "--how", "aaaa0006")
        self.assert_refused("link", "aaaa0006", "--how", "aaaa0002", mention="cycle")

    def test_forbidden_pair_refused(self):
        self.assert_refused("link", "aaaa0001", "--requires", "aaaa0003", mention="function to solution")
        self.assert_refused("link", "aaaa0003", "--requires", "aaaa0002", mention="solution to function")
        self.add("aaaa0007", "Part", "component")
        self.assert_refused("link", "aaaa0001", "--how", "aaaa0007", mention="function to component")
        self.assert_refused("link", "aaaa0003", "--constrains", "aaaa0002", mention="solution to function")

    def test_mixed_children_refused(self):
        self.add("aaaa0006", "Sub", "function")
        self.assert_refused("link", "aaaa0002", "--how", "aaaa0006", mention="all functions or all solutions")

    def test_duplicate_and_self_refused(self):
        self.assert_refused("link", "aaaa0002", "--how", "aaaa0003", mention="already exists")
        self.assert_refused("link", "aaaa0003", "--requires", "aaaa0003", mention="itself")

    def test_constrains_link(self):
        self.add("aaaa0008", "Budget", "constraint")
        self.run_ok("link", "aaaa0008", "--constrains", "aaaa0002")
        self.assertIn({"from": "aaaa0008", "to": "aaaa0002", "type": "constrains", "src": "user", "hint": "Budget constrains Drive"}, self.links())

    def test_remove_link_leaves_others(self):
        self.run_ok("link", "aaaa0003", "--requires", "aaaa0004")
        before = self.links_text().splitlines()
        self.run_ok("unlink", "aaaa0003", "--requires", "aaaa0004")
        self.assertEqual(self.links_text().splitlines(), [l for l in before if '"requires"' not in l])
        self.assertEqual(self.run_cmd("unlink", "aaaa0003", "--requires", "aaaa0004")[0], 1)

    def test_remove_how_link(self):
        self.run_ok("unlink", "aaaa0002", "--how", "aaaa0004")
        self.assertEqual(len([l for l in self.links() if l["type"] == "how"]), 2)

    def test_prefix_and_ambiguity(self):
        self.run_ok("link", "aaaa0003", "--excludes", "aaaa0004")
        code, _, err = self.run_cmd("link", "aaaa000", "--requires", "aaaa0003")
        self.assertEqual(code, 1)
        self.assertIn("aaaa0001", err)
        self.assertIn("aaaa0004", err)
        self.add("bbbb0001", "Unique")
        self.run_ok("link", "aaaa0002", "--how", "bbbb")
        self.assertEqual(self.run_cmd("link", "zz", "--how", "aaaa0001")[0], 1)

    # -- Node creation --------------------------------------------------------

    def test_new_solution_under_function(self):
        new_id = self.run_ok("new", "Rack and pinion", "--type", "solution", "--why", "aaaa0002").strip()
        self.assertRegex(new_id, r"^[0-9a-f]{8}$")
        text = (self.dir / "rack-and-pinion.md").read_text()
        self.assertIn(f'id: "{new_id}"', text)
        self.assertIn("type: solution", text)
        self.assertIn('sources: ["user"]', text)
        self.assertIn({"from": "aaaa0002", "to": new_id, "type": "how", "src": "user", "hint": "Drive > Rack and pinion"}, self.links())

    def test_new_requires_type(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            graph.main(["--graph-dir", str(self.dir), "new", "No type", "--why", "aaaa0002"], io.StringIO())

    def test_new_name_collision_gets_suffix(self):
        self.run_ok("new", "Same", "--type", "solution", "--why", "aaaa0002")
        self.run_ok("new", "Same", "--type", "solution", "--why", "aaaa0002")
        self.assertIn("same.md", self.files())
        self.assertIn("same-2.md", self.files())

    def test_new_two_whys_and_options(self):
        self.add("aaaa0006", "Other", "function")
        self.add("aaaa0005", "Belt kit")
        new_id = self.run_ok(
            "new", "Shared", "--type", "function", "--why", "aaaa0003", "--why", "aaaa0004", "--source", "u", "--source", "LLM:x",
            "--confidence", "low",
        ).strip()
        text = (self.dir / "shared.md").read_text()
        for expected in ('sources: ["u", "LLM:x"]', "confidence: low", "type: function"):
            self.assertIn(expected, text)
        self.assertEqual([l["from"] for l in self.links() if l["to"] == new_id], ["aaaa0003", "aaaa0004"])

    def test_new_first_function_becomes_root(self):
        for p in list(self.dir.iterdir()):
            p.unlink()
        new_id = self.run_ok("new", "Draw things", "--type", "function").strip()
        self.assertTrue((self.dir / "draw-things.md").exists())
        self.assertEqual(self.links_text(), "")
        self.assertIn(new_id, self.run_ok("tree"))
        self.assert_refused("new", "Second root", "--type", "function", mention="already has a root")

    def test_new_missing_or_unknown_why_writes_nothing(self):
        self.assert_refused("new", "Nope", "--type", "solution", mention="needs at least one --why")
        self.assert_refused("new", "Nope", "--type", "solution", "--why", "deadbeef", mention="deadbeef")

    def test_new_forbidden_pair_writes_nothing(self):
        self.assert_refused("new", "Part", "--type", "component", "--why", "aaaa0002", mention="function to component")
        self.assert_refused("new", "Sub", "--type", "function", "--why", "aaaa0002", mention="all functions or all solutions")

    def test_new_constraint(self):
        new_id = self.run_ok("new", "Budget", "--type", "constraint", "--constrains", "aaaa0002").strip()
        self.assertTrue((self.dir / "budget.md").exists())
        self.assertIn({"from": new_id, "to": "aaaa0002", "type": "constrains", "src": "user", "hint": "Budget constrains Drive"}, self.links())
        self.assert_refused("new", "Loose", "--type", "constraint", mention="--constrains")
        self.assert_refused("new", "Odd", "--type", "constraint", "--constrains", "aaaa0003", mention="solution")

    # -- Hints and format -----------------------------------------------------

    def test_format_refreshes_hints_only(self):
        self.add("aaaa0003", "Belt, renamed")
        before = self.links_text().splitlines()
        self.run_ok("format")
        after = self.links_text().splitlines()
        self.assertEqual(len(before), len(after))
        changed = [(b, a) for b, a in zip(before, after) if b != a]
        self.assertEqual(len(changed), 1)
        self.assertIn("Drive > Belt, renamed", changed[0][1])
        self.assertEqual(json.loads(changed[0][0])["to"], json.loads(changed[0][1])["to"])

    def test_format_fixes_order_and_keys(self):
        (self.dir / "links.jsonl").write_text(
            '{"type":"how","src":"x","to":"aaaa0004","from":"aaaa0002"}\n'
            '{"type":"how","src":"x","to":"aaaa0002","from":"aaaa0001"}\n'
        )
        self.run_ok("format")
        self.assertEqual(
            self.links_text(),
            '{"from":"aaaa0001","to":"aaaa0002","type":"how","src":"x","hint":"Main > Drive"}\n'
            '{"from":"aaaa0002","to":"aaaa0004","type":"how","src":"x","hint":"Drive > Leadscrew"}\n',
        )

    # -- Tree -----------------------------------------------------------------

    def test_tree_labels(self):
        lines = self.run_ok("tree").splitlines()
        self.assertEqual(
            lines,
            ["aaaa0001 Main", "  aaaa0002 Drive [AND]", "    aaaa0003 GT2 belt [OR]", "    aaaa0004 Leadscrew [OR]"],
        )

    def test_tree_two_whys_and_constraint(self):
        self.add("aaaa0005", "Shared", "function")
        self.add("aaaa0006", "Pulley")
        self.run_ok("link", "aaaa0003", "--how", "aaaa0005")
        self.run_ok("link", "aaaa0004", "--how", "aaaa0005")
        self.run_ok("link", "aaaa0005", "--how", "aaaa0006")
        self.run_ok("new", "Budget", "--type", "constraint", "--constrains", "aaaa0002")
        lines = self.run_ok("tree").splitlines()
        self.assertIn("    aaaa0003 GT2 belt [OR]", lines)
        self.assertIn("      aaaa0005 Shared [AND]", lines)
        self.assertIn("      aaaa0005 Shared [AND] (repeated)", lines)
        self.assertEqual(sum("Pulley [OR]" in l for l in lines), 1)
        self.assertTrue(any(l.startswith("    ") and l.endswith("Budget [constraint]") for l in lines))

    # -- Order ----------------------------------------------------------------

    def test_link_with_order_and_key_order(self):
        self.add("aaaa0005", "Extra")
        self.run_ok("link", "aaaa0002", "--how", "aaaa0005", "--order", "3")
        line = [l for l in self.links_text().splitlines() if '"aaaa0005"' in l][0]
        self.assertEqual(line, '{"from":"aaaa0002","to":"aaaa0005","type":"how","order":3,"src":"user","hint":"Drive > Extra"}')

    def test_order_without_how_refused(self):
        self.add("aaaa0005", "Extra")
        self.assert_refused("link", "aaaa0005", "--requires", "aaaa0003", "--order", "1", mention="--order")

    def test_order_command_sets_and_unlists_lose_order(self):
        self.add("aaaa0005", "Extra")
        self.run_ok("link", "aaaa0002", "--how", "aaaa0005")
        self.run_ok("order", "aaaa0002", "aaaa0004", "aaaa0003", "aaaa0005")
        orders = {l["to"]: l.get("order") for l in self.links() if l["type"] == "how" and l["from"] == "aaaa0002"}
        self.assertEqual(orders, {"aaaa0004": 1, "aaaa0003": 2, "aaaa0005": 3})
        self.run_ok("order", "aaaa0002", "aaaa0005", "aaaa0004")
        orders = {l["to"]: l.get("order") for l in self.links() if l["type"] == "how" and l["from"] == "aaaa0002"}
        self.assertEqual(orders, {"aaaa0005": 1, "aaaa0004": 2, "aaaa0003": None})
        self.assertEqual(self.links_text().splitlines(), sorted(self.links_text().splitlines(), key=lambda t: (json.loads(t)["type"], json.loads(t)["from"], json.loads(t)["to"])))
        self.assertEqual(self.run_cmd("order", "aaaa0002", "aaaa0003")[0], 0)

    def test_order_command_not_a_child(self):
        before = self.links_text()
        self.assert_refused("order", "aaaa0002", "aaaa0003", "aaaa0001", mention="not a how child")
        self.assert_refused("order", "aaaa0002", "aaaa0003", "aaaa0003", mention="twice")
        self.assertEqual(self.links_text(), before)

    def test_order_is_per_parent(self):
        self.add("aaaa0005", "Other", "function")
        self.run_ok("link", "aaaa0001", "--how", "aaaa0005")
        self.run_ok("link", "aaaa0005", "--how", "aaaa0003")
        self.run_ok("order", "aaaa0005", "aaaa0003")
        self.run_ok("order", "aaaa0002", "aaaa0004", "aaaa0003")
        self.run_ok("order", "aaaa0002", "aaaa0003", "aaaa0004")
        under = {(l["from"], l["to"]): l.get("order") for l in self.links() if l["type"] == "how"}
        self.assertEqual(under[("aaaa0005", "aaaa0003")], 1)
        self.assertEqual(under[("aaaa0002", "aaaa0003")], 1)
        self.assertEqual(under[("aaaa0002", "aaaa0004")], 2)
        self.assertIsNone(under[("aaaa0001", "aaaa0002")])

    def test_tree_follows_order(self):
        self.run_ok("order", "aaaa0002", "aaaa0004", "aaaa0003")
        lines = self.run_ok("tree").splitlines()
        self.assertEqual(lines[2:], ["    aaaa0004 Leadscrew [OR]", "    aaaa0003 GT2 belt [OR]"])

    def test_lint_partly_ordered(self):
        self.run_ok("order", "aaaa0002", "aaaa0004")
        code, out, _ = self.run_cmd("lint")
        self.assertEqual(code, 1)
        self.assertIn("partly ordered children", out)
        self.assertIn("aaaa0002 Drive", out)
        self.run_ok("order", "aaaa0002", "aaaa0004", "aaaa0003")
        self.assertEqual(self.run_cmd("lint")[:2], (0, ""))

    # -- Lint -----------------------------------------------------------------

    def test_lint_clean(self):
        code, out, _ = self.run_cmd("lint")
        self.assertEqual((code, out), (0, ""))

    def test_lint_redundant_how(self):
        self.add("aaaa0005", "Power", "function")
        self.add("aaaa0006", "Wiring", "function")
        self.run_ok("link", "aaaa0001", "--how", "aaaa0005")
        self.run_ok("link", "aaaa0005", "--how", "aaaa0006")
        self.run_ok("link", "aaaa0001", "--how", "aaaa0006")
        code, out, _ = self.run_cmd("lint")
        self.assertEqual(code, 1)
        self.assertEqual(len(out.splitlines()), 1)
        self.assertIn("redundant how link: aaaa0001 Main -> aaaa0006 Wiring", out)

    def test_lint_mixed_children(self):
        self.add("aaaa0005", "Sub", "function")
        (self.dir / "links.jsonl").write_text(self.links_text() + '{"from":"aaaa0002","to":"aaaa0005","type":"how","src":"x"}\n')
        self.run_ok("format")
        code, out, _ = self.run_cmd("lint")
        self.assertEqual(code, 1)
        self.assertIn("function with both function and solution children: aaaa0002 Drive", out)

    def test_lint_findings(self):
        self.run_ok("link", "aaaa0003", "--requires", "aaaa0004")
        self.run_ok("link", "aaaa0004", "--excludes", "aaaa0003")
        self.add("aaaa0009", "Loose")
        self.add("aaaa000a", "Budget", "constraint")
        self.add("aaaa0003", "Renamed")
        before = self.links_text()
        code, out, _ = self.run_cmd("lint")
        self.assertEqual(code, 1)
        self.assertIn("requires and excludes on the same pair", out)
        self.assertIn("unreachable from the root function: aaaa0009 Loose", out)
        self.assertIn("constraint without a constrains link: aaaa000a Budget", out)
        self.assertIn("stale hint", out)
        self.assertEqual(self.links_text(), before)

    # -- The Node build accepts what the tool writes --------------------------

    def test_node_build_accepts_tool_output(self):
        a = self.run_ok("new", "Rack", "--type", "solution", "--why", "aaaa0002").strip()
        self.run_ok("link", a, "--excludes", "aaaa0003")
        self.run_ok("new", "Budget", "--type", "constraint", "--constrains", "aaaa0002")
        out = Path(self._tmp.name) / "graph.json"
        result = subprocess.run(
            ["node", str(REPO / "scripts/build-graph.mjs"), str(self.dir), str(out)], capture_output=True, text=True
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(out.read_text())
        by_id = {n["id"]: n for n in data["nodes"]}
        self.assertEqual(data["root"], "aaaa0001")
        self.assertEqual(by_id[a]["why"], ["aaaa0002"])
        self.assertEqual(by_id["aaaa0003"]["excludes"], [a])


if __name__ == "__main__":
    unittest.main()
