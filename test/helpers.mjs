// Node ids are random hex, so tests find nodes by title.
export function idByTitle(nodes) {
  return (title) => {
    const found = nodes.filter((n) => n.title === title);
    if (found.length !== 1) throw new Error(`expected one node titled "${title}", found ${found.length}`);
    return found[0].id;
  };
}
