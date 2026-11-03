export const DEFAULT_HASH = '#/design';

// '#/<page>?pick=a,b&view=<id>' -> { page, pick, view, unknown }. Pages: design (default), graph.
// Legacy '#/selection' is read as Design; '#/browse[/<id>]' as Graph with view=<id> (root means no view).
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
  const legacyBrowse = m?.[1] === 'browse';
  const page = m?.[1] === 'graph' || legacyBrowse ? 'graph' : 'design';
  let view = query.get('view') || '';
  if (!view && legacyBrowse) {
    const legacy = decodeURIComponent(m[2] ?? '');
    if (legacy && legacy !== 'root') view = legacy;
  }
  return { page, pick, view: view && keep(view) ? view : null, unknown };
}

export function buildHash(page, { pick = [], view = null } = {}) {
  const query = [];
  if (pick.length) query.push(`pick=${pick.join(',')}`);
  if (view) query.push(`view=${view}`);
  return `#/${page === 'graph' ? 'graph' : 'design'}${query.length ? `?${query.join('&')}` : ''}`;
}
