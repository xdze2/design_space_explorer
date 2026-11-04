export const DEFAULT_HASH = '#/';

// '#/?pick=a,b&view=<id>' -> { pick, view, unknown }. Obsolete parameters (up, down, layout) are ignored.
// Old links still read: '#/design' and '#/graph' as the same page, '#/browse[/<id>]' as view=<id> (root means no view).
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
  const pick = (query.get('pick') ?? '').split(',').filter(Boolean).filter(keep);
  let view = query.get('view') || '';
  if (!view && m?.[1] === 'browse') {
    const legacy = decodeURIComponent(m[2] ?? '');
    if (legacy && legacy !== 'root') view = legacy;
  }
  return { pick, view: view && keep(view) ? view : null, unknown };
}

export function buildHash({ pick = [], view = null } = {}) {
  const query = [];
  if (pick.length) query.push(`pick=${pick.join(',')}`);
  if (view) query.push(`view=${view}`);
  return `#/${query.length ? `?${query.join('&')}` : ''}`;
}
