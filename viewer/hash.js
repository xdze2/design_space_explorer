export const DEFAULT_HASH = '#/browse/root';

// '#/browse/<id>' or '#/select?pick=a,b' -> { view, params, unknown }.
// `known` is a Set of node ids; ids not in it are dropped and reported in `unknown`.
export function parseHash(hash, known) {
  const m = hash.replace(/^#/, '').match(/^\/([a-z]+)(?:\/([^?]*))?(?:\?(.*))?$/);
  const view = m?.[1] === 'select' ? 'select' : 'browse';
  const unknown = [];
  const keep = (id) => {
    if (known.has(id)) return true;
    unknown.push(id);
    return false;
  };
  if (view === 'select') {
    const pick = new URLSearchParams(m?.[3] ?? '').get('pick') ?? '';
    return { view, params: { pick: pick.split(',').filter(Boolean).filter(keep) }, unknown };
  }
  const id = decodeURIComponent(m?.[2] ?? '') || 'root';
  return { view, params: { id: keep(id) ? id : 'root' }, unknown };
}

export function buildHash(view, params = {}) {
  if (view === 'select') {
    const pick = (params.pick ?? []).join(',');
    return pick ? `#/select?pick=${pick}` : '#/select';
  }
  return `#/browse/${params.id ?? 'root'}`;
}
