export const DEFAULT_HASH = '#/selection';

// '#/<page>?pick=a,b&view=<id>' -> { page, pick, view, unknown }.
// Legacy '#/browse/<id>' is read as Browse with view=<id> (root means no view).
// `known` is a Set of node ids; ids not in it are dropped and reported in `unknown`.
export function parseHash(hash, known) {
  const m = hash.replace(/^#/, '').match(/^\/([a-z]+)(?:\/([^?]*))?(?:\?(.*))?$/);
  const unknown = [];
  const keep = (id) => {
    if (known.has(id)) return true;
    unknown.push(id);
    return false;
  };
  const query = new URLSearchParams(m?.[3] ?? '');
  const pick = (query.get('pick') ?? '').split(',').filter(Boolean).filter(keep);
  const page = m?.[1] === 'browse' ? 'browse' : 'selection';
  let view = query.get('view') || '';
  if (!view && page === 'browse') {
    const legacy = decodeURIComponent(m[2] ?? '');
    if (legacy && legacy !== 'root') view = legacy;
  }
  return { page, pick, view: view && keep(view) ? view : null, unknown };
}

export function buildHash(page, { pick = [], view = null } = {}) {
  const query = [];
  if (pick.length) query.push(`pick=${pick.join(',')}`);
  if (view) query.push(`view=${view}`);
  return `#/${page === 'browse' ? 'browse' : 'selection'}${query.length ? `?${query.join('&')}` : ''}`;
}
