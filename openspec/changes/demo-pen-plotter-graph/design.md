# Design

## Context

Greenfield repository: only `openspec/` and `proposal_draft.md` exist. Node 22 is installed. The graph is consumed later by a static viewer, so the build output must be self-contained. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A node format that is pleasant to edit by hand and easy for an LLM to read and write.
- A small, strict-enough build step that catches broken references early.
- Demo content real enough to expose schema gaps.

**Non-Goals:**
- Constraint solving or propagation. The viewer will do simple filtering over the edges later.
- Backward compatibility. The format is expected to change while the demo teaches us what is missing.

## Decisions

**Layout.** `graph/` holds nodes in subfolders by decision (for example `graph/gantry/corexy.md`), `scripts/build-graph.mjs` is the build, `graph.json` is written at the repo root (committed, so the viewer works without a build), and `raw/` is git-ignored.
*Alternative:* one flat folder. Rejected: subfolders make the hierarchy visible in the file tree. The folder is only a convention, and `parent` is the source of truth.

**Node id = relative path without extension.** Stable, readable in references, and unique by construction. *Alternative:* a separate `id` field. Rejected as redundant.

**Four node types: `root`, `decision`, `option`, `component`.** A decision groups alternatives, an option is one alternative, and a component is a concrete purchasable item (for example a specific rail) under an option. Only `decision` and `option` are required in the demo.

**Hierarchy via `parent`, constraints via edges.** The tree gives the broad-first browsing order. `requires`, `excludes` and `compatible_with` express cross-links between branches. `excludes` is normalized to be symmetric in the output so consumers don't have to handle both directions.

**Loose constraints.** Edges only reference nodes, with no expressions (no "A requires B or C"). Subtleties go in the prose body. This matches the plan to let an LLM interpret or a later change add rigor.

**Sources are free-text strings.** A URL, `user`, or `LLM:<model>`. `confidence` is optional and by convention `low` for unchecked LLM content.

**Build script.** Dependency-light Node ESM script using the `yaml` package for frontmatter, since a hand-rolled YAML parser is a bug source. It collects all errors, then fails once, and only writes `graph.json` on success. Tests use the built-in `node:test` runner against small fixture folders.
*Alternative:* Python. Rejected because the viewer will be JavaScript and a single toolchain keeps things light.

**Demo content process.** An agent drafts nodes from its own knowledge marked `LLM:<model>` with `confidence: low`. You then upgrade them with real sources as you research. This keeps the demo fast while the provenance stays honest.

## Risks / Trade-offs

- [Schema turns out wrong once the viewer exists] → Expected. Keep the schema small and the demo small so changing it is cheap.
- [LLM-drafted demo content is inaccurate] → Mark it `LLM:<model>` and `confidence: low`. The goal is exercising the format, not publishing facts.
- [`requires` as AND-only is too weak for real cases] → Accept for v1, and record cases the demo hits in node bodies.
- [Committed `graph.json` drifts from `graph/`] → The build is a single command. A check that the committed file matches a fresh build can be added later.

## Findings

Schema gaps found while writing the 20-node demo graph:

- **No numeric attributes.** Cost, travel, steps/mm and similar figures only live in prose (for example the "$150 BOM"). A building assistant cannot sum a budget or filter by price. A candidate is an optional `attributes` map (`cost_usd: 12`).
- **`requires` is AND-only.** "CoreXY works with GRBL (compile option) or FluidNC" had to become two `compatible_with` edges, and the GRBL servo caveat ("needs a servo-capable fork") stays in prose.
- **Soft vs hard constraints are not distinguished.** `gantry/single-rail-cantilever` excludes `linear-guide/smooth-rods` is a strong engineering judgement, not a physical impossibility, and `drive/leadscrew` vs CoreXY is a hard one. Both are `excludes`. A `strength` hint or prose convention may be needed.
- **No per-claim sources.** `sources` is per node, so the raw chat export covers a whole node and cannot point at the sentence that supports a claim.
- **Cross-decision options with no clean parent.** The controller's firmware, the 2020 vs 2040 beam section and the drivers (A4988 vs TMC2209) are decisions the raw data touches but the five-decision tree does not hold. The `component` type is unused so far.
- **The decision/folder convention.** Decision nodes live at `graph/<decision>.md` with options in `graph/<decision>/`, which gives ids like `gantry` and `gantry/corexy`. It works, but nothing enforces that an option's folder matches its parent.
- **Content still unsourced.** The Reddit A2 AxiDraw-style post and "UMMD's CoreXY" from the raw chat were never read, so every node is `LLM:` with `confidence: low`.
