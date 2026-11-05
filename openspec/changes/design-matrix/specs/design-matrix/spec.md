## ADDED Requirements

### Requirement: Designs index
The build SHALL write `topics/<topic>/designs/index.json`, an object `{ "designs": [...] }` listing the file names matching `*.design.json` in that folder, sorted by name. A missing or empty folder SHALL give an empty list. Other files SHALL NOT be listed.

#### Scenario: Index after a build
- **GIVEN** `designs/` holds `easydraw-v4.design.json` and `axidraw-v3.design.json`
- **WHEN** the build runs for that topic
- **THEN** `designs/index.json` lists `axidraw-v3.design.json` then `easydraw-v4.design.json`

#### Scenario: No designs
- **WHEN** the build runs for a topic whose `designs/` folder is empty or absent
- **THEN** the index lists no designs and the build succeeds

### Requirement: Matrix page
The viewer SHALL have a page `matrix.html` that, for the topic in `?topic=` (default `pen_plotter`), loads the graph and every design in the designs index and shows one table: one column per design, headed by its name, and one row per node of the graph's tree. The page SHALL NOT include the user's working design and SHALL NOT change any design. The graph page and the matrix page SHALL link to each other.

#### Scenario: Columns from the catalogue
- **GIVEN** an index listing three designs
- **WHEN** the matrix page opens
- **THEN** the table has three design columns, headed by the designs' names, in index order

#### Scenario: Not a design
- **GIVEN** an indexed file that is not valid JSON, or whose `topic` is another topic
- **WHEN** the matrix page opens
- **THEN** it shows a notice naming the file, and no column for it; the other columns are shown

#### Scenario: Read-only
- **WHEN** the user clicks cells, rows and filters
- **THEN** no design file and no saved working design changes

### Requirement: Matrix rows
The rows SHALL follow the graph view's tree order and look (indentation, node icon, name linking to the node), made of the rows the graph view would show for each kept design with nothing folded or peeked, merged by node id; constraint rows come last. A row SHALL appear if it is visible in at least one kept column. Rows with a hidden subtree SHALL have a fold control, and folding SHALL hide the rows under it in every column.

#### Scenario: Union of rows
- **GIVEN** design A chose `CoreXY` and design B chose `Cartesian two Y rails`, each bringing its own sub-functions
- **WHEN** both columns are kept
- **THEN** the sub-function rows of both choices are shown

#### Scenario: Filtering shrinks the rows
- **WHEN** a filter removes design B
- **THEN** rows visible only in design B disappear

#### Scenario: Fold
- **WHEN** the user folds a function row
- **THEN** the rows below it are hidden in all columns and the row says how many are hidden

### Requirement: Matrix cells
A cell SHALL show, for a function that offers solutions, the design's chosen solution as a chip styled like the graph view's chosen chip, or the function's open or exploring status when nothing is chosen; for a component, a tick when the design uses it; for a constraint, the design's value text. A row that is not visible in a design's own tree SHALL show a dim "—" in that design's column. Clicking a function's name or a chip SHALL open the node in the graph page.

#### Scenario: Chosen solution
- **GIVEN** a design that chose `CoreXY` for `Move the pen in XY`
- **WHEN** the matrix shows
- **THEN** that cell holds a `CoreXY` chip

#### Scenario: Not applicable
- **GIVEN** a design that chose a solution without the sub-function `Keep the gantry square`
- **THEN** that row's cell in that design's column is a dim "—"

#### Scenario: Constraint value
- **GIVEN** a design with the value "under 200 EUR" for `Budget`
- **THEN** the `Budget` cell shows that text

### Requirement: Differences between designs
A row SHALL be marked when its cells are not all the same across the kept columns. With a single kept column no row SHALL be marked.

#### Scenario: Differing row
- **GIVEN** two kept designs with different drive solutions
- **THEN** the row for that function is marked, and a row where both chose the same solution is not

### Requirement: Uses-node filters
The matrix page SHALL offer filters "uses node X", where X is a solution or a component. A design SHALL use a solution if it chose it, and a component if it is, directly or through other components, a `how` target of a solution the design chose; shortlisted and rejected solutions SHALL NOT count. With several filters the page SHALL keep only the designs that use all of them. The picker SHALL list the solutions and components grouped by type, each with the number of catalogue designs that use it. Active filters SHALL be shown as removable chips and SHALL be kept in the URL.

#### Scenario: Stepper motors only
- **GIVEN** three designs, two of which use the node `Stepper motors`
- **WHEN** the user adds the filter `Stepper motors`
- **THEN** only those two columns remain

#### Scenario: Two filters
- **WHEN** the user adds the filters `Stepper motors` and `CoreXY`
- **THEN** only designs that use both remain

#### Scenario: Shortlisted does not count
- **GIVEN** a design that shortlisted `CoreXY` but chose another solution
- **WHEN** the filter `CoreXY` is active
- **THEN** that design is not kept

#### Scenario: Counts in the picker
- **WHEN** the picker is open
- **THEN** each entry shows the number of catalogue designs that use it

#### Scenario: No match
- **WHEN** the filters match no design
- **THEN** the page says no design matches and offers to clear the filters

#### Scenario: Filters in the URL
- **WHEN** a filter is added
- **THEN** the page URL contains it, and opening that URL shows the same filtered table

#### Scenario: Unknown filter id
- **WHEN** the URL names a filter id that is not a solution or component of the graph
- **THEN** it is ignored and a notice says so
