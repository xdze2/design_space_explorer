---
name: ingest
description: Ingest one source (a web page, a product page, a chat, a raw file) into a topic's knowledge graph and, for a product, its design file. Use when the user says "ingest", "add a source", "process the inbox", or gives a product or article URL to add to the design space.
---

# Ingest a source

Turn one source into changes to a topic's knowledge graph (`topics/<topic>/knowledge_graph/`) and, for a product page, one design file (`topics/<topic>/designs/`).

**Hard rule: write nothing under `knowledge_graph/` or `designs/` before the user has approved the plan (step 4).** Only the raw file and `inbox.md` may change before that. Never commit.

Format rules are in the README, not here: [Node format](../../README.md#node-format), [Links file](../../README.md#links-file), [Editing the graph](../../README.md#editing-the-graph), [The design document](../../README.md#the-design-document). Read the sections you need before step 5.

## Inputs

- **Source**: a URL, an item of `inbox.md` (one line per item, optional `<topic>:` prefix), or a file already in `topics/<topic>/raw/`. If the user gave no source, list the inbox items and the raw files without a header, ask which one to ingest, and stop there: do not start step 1, even when the inbox holds a single item.
- **Topic**: from the inbox prefix or the user, else `pen_plotter`.

One source per run. If the user asks for several, do them one after the other, each with its own plan.

## Steps

### 1. Collect

Make sure the source has a raw file `topics/<topic>/raw/<name>.md` starting with this header:

```markdown
# <title of the page or source>

Collected <YYYY-MM-DD>. <Summary | Verbatim copy> of <kind: web page, product page, chat, ...>.

Sources:
- <who / what>: <public URL>
```

- Look first for an existing raw file of the same page (`grep -rlF <URL> topics/<topic>/raw/`, or a file named after the page title); if there is one, use it.
- New URL: fetch it, write the raw file (a short summary of what matters for the design space, or a verbatim copy). Name summaries `web - <topic of the page>.md`. If the page cannot be fetched, ask the user to save it into `raw/` and stop.
- File already in `raw/` without the header: add the header first, keep the body.
- From the inbox: remove its line from `inbox.md` once the raw file exists. Leave the other lines and sections as they are.

`raw/` is git-ignored: the raw file is for this run and later runs, never a citation (step 5).

### 2. Classify

- **Topic source**: discusses options, tradeoffs or parts (an article, a comparison, a forum thread, a chat).
- **Product page**: describes one existing machine and the choices it made.

A source that is both is a product page. State the class in the plan.

### 3. Map onto the tree

Run `python3 tools/graph.py --topic <topic> tree` and read the nodes the source touches. For each finding in the source decide:

- it is an existing node: cite it (add the URL to its `sources`) or extend its body or summary with what is new;
- it is a missing function, solution, component or constraint: a new node, under which why;
- it is a relation: a new `requires`, `excludes`, `compatible_with` or `fares` link;
- it adds nothing new: say so.

Reuse before creating: a node with another name for the same thing is the same node. For a product page, also map each of the product's choices to a function and one of its solutions, and note the functions the page does not settle.

### 4. Plan, then wait

Show the plan (template below) and stop. Apply only the items the user approves ("go", "1-4 and 7", ...). If they change an item, show the changed item again before applying it.

### 5. Apply the graph edits

- Only with `tools/graph.py` (`new`, `link`, `unlink`, `order`). Never edit `links.jsonl` by hand. Node files may be edited by hand for the body, `summary` and `sources`.
- New nodes: `--source <URL>` (and `--source LLM:<model>` if you wrote content the page does not state), `--confidence low` for unchecked LLM content, `--summary` for a solution or component. Links: `--src <URL>` when the source states the relation, else `--src LLM:<model>`.
- Citations are public URLs, `user` or `LLM:<model>`, never a path into `raw/` (lint reports it).
- Write the body of each new node (template below). For a new solution or component, add `fares` links against the constraints where it differs from its siblings under the same function, scored relative to them.

### 6. Product design file (product pages only)

Write `topics/<topic>/designs/<slug>.design.json` (template below), `<slug>` from the product name (`easydraw-v4`).

- `id`: `d-` + the first 8 hex characters of `printf %s <slug> | sha1sum`, so a re-ingest keeps the id.
- `intent`: one line on the product, then its URL.
- `constraints`: values the page states, keyed by constraint node id, as prose (`"A3; A4 and A2 versions exist"`).
- `functions`: each function the page settles gets `"choice": <solution id>`. A function the page does not settle gets no choice and `"notes": "Not stated on the product page."` A product solution missing from the graph is a plan item (new node); the design chooses it once it exists.

### 7. Check and report

Run, and fix what they report:

```sh
python3 tools/graph.py --topic <topic> lint
npm run build -- <topic>
npm test
```

Then report: nodes created and edited, links added, design file written, items the user declined, and open questions (for example functions the product page leaves open). Do not commit.

## Templates

### Plan

```markdown
**Source**: <title> (<URL>), raw file `raw/<name>.md`
**Class**: product page | topic source

New nodes
1. solution "<title>" under <why id> <why title>: <why it is needed>. Source: <URL>
Links
2. <from title> requires <to title>: <why>. Source: <URL>
3. <title> fares <constraint> +1: <why, relative to its siblings>
Edits
4. <node id> <title>: add source <URL>; body: <what is added>
Design file
5. `designs/<slug>.design.json`: <function> = <solution>, ...; open: <functions>
Nothing new
- <finding>: already in <node id> <title>
Questions
- <anything you could not decide>
```

### Node body

```markdown
<One or two sentences: what it is, for a function what must be achieved.>

**Why choose it.** <What it gives over its siblings.>

**Tradeoffs.** <What it costs, brings in or rules out.>

**Links.** <The reason for each requires, excludes, compatible_with and fares link.>
```

A function or constraint body drops "Why choose it" and says why it matters and what limits it sets.

### Product design file

```json
{
  "format": 1,
  "topic": "<topic>",
  "id": "d-<8 hex>",
  "name": "<Product name>",
  "intent": "<One line on the product>. <URL>",
  "constraints": { "<constraint id>": "<value stated on the page>" },
  "functions": {
    "<function id>": { "choice": "<solution id>" },
    "<function id>": { "notes": "Not stated on the product page." }
  }
}
```

The tests load every committed design against the topic's `graph.json` and fail on anything dropped.
