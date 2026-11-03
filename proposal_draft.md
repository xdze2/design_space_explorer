design space explorer

a tool to discover a subject, using combinatorial approach,
graph exploration, constraint resolution

Analyse fonctionnel

Spec and design descision space,

for instace using "building a pen plotter" example

the design descision space is a graph

How, Why, Alternatives, Constraint

for example we can list all kwnon gantry geometry,
and all available rail stocks

then do a cartesian product exploration,

or a building assistant, the user make choices, and for each choice the implication are shown...

- knowledge base as a Graph (ontologie)
- exploration interface: "what about this combinaison of choice ?"

for example `query=(A, B, not D, E)`

IA assisted
web static app (json, javascript, markdown)

it's actually a set of skill to be used by an IA agent,
similar to A. Karpathy LLM wiki idea

- a raw data folder
- a kwnoledge graph maintain by the IA
- A viewer for the user

Not a force based graph layout,
could be generated on the fly by a LLM api, with a cache
information sourced as much as possible, keeping raw data dir non commited
