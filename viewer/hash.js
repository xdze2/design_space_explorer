export const DEFAULT_HASH = '#/selection';

// '#/browse/<id>?pick=a,b' or '#/selection?pick=a,b' -> { page, params, pick, unknown }.
// `known` is a Set of node ids; ids not in it are dropped and reported in `unknown`.
export function parseHash(hash, known) {
  const m = hash.replace(/^#/, '').match(/^\/([a-z]+)(?:\/([^?]*))?(?:\?(.*))?$/);
  const unknown = [];
  const keep = (id) => {
    if (known.has(id)) return true;
    unknown.push(id);
    return false;
  };
  const picked = new URLSearchParams(m?.[3] ?? '').get('pick') ?? '';
  const pick = picked.split(',').filter(Boolean).filter(keep);
  if (m?.[1] === 'browse') {
    const id = decodeURIComponent(m[2] ?? '') || 'root';
    return { page: 'browse', params: { id: keep(id) ? id : 'root' }, pick, unknown };
  }
  return { page: 'selection', params: {}, pick, unknown };
}

export function buildHash(page, params = {}, pick = []) {
  const path = page === 'browse' ? `#/browse/${params.id ?? 'root'}` : '#/selection';
  return pick.length ? `${path}?pick=${pick.join(',')}` : path;
}
