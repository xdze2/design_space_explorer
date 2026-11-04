export const DEFAULT_HASH = '#/';

// '#/?view=<id>&fold=<id>,<id>&peek=<id>,<id>' -> { view, fold, peek, unknown, pickIgnored }. View state only: the design is not in the URL.
// Obsolete parameters (up, down, layout) are ignored; `pick` is ignored too and reported in `pickIgnored`.
// Old links still read: '#/design', '#/graph' and '#/selection' as the page, '#/browse[/<id>]' as view=<id> (root means none).
// `known` is a Set of node ids; ids not in it are dropped and reported in `unknown`.
export function parseHash(hash, known) {
  const m = hash.replace(/^#/, '').match(/^\/([a-z]*)(?:\/([^?]*))?(?:\?(.*))?$/);
  const unknown = [];
  const keep = (id) => {
    if (known.has(id)) return true;
    unknown.push(id);
    return false;
  };
  const query = new URLSearchParams(m?.[3] ?? '');
  const list = (name) => [...new Set((query.get(name) ?? '').split(',').filter(Boolean))].filter(keep);
  let view = query.get('view') || '';
  if (!view && m?.[1] === 'browse') {
    const legacy = decodeURIComponent(m[2] ?? '');
    if (legacy && legacy !== 'root') view = legacy;
  }
  view = view && keep(view) ? view : null;
  const fold = list('fold');
  const peek = list('peek');
  return { view, fold, peek, unknown, pickIgnored: query.has('pick') };
}

export function buildHash({ view = null, fold = [], peek = [] } = {}) {
  const query = [];
  if (view) query.push(`view=${view}`);
  if (fold.length) query.push(`fold=${fold.join(',')}`);
  if (peek.length) query.push(`peek=${peek.join(',')}`);
  return `#/${query.length ? `?${query.join('&')}` : ''}`;
}
