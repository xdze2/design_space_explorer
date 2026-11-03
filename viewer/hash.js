import { DEFAULT_UP, DEFAULT_DOWN } from './outline.js';

export const DEFAULT_HASH = '#/design';

// Outline depth: an integer 0..20, anything else gives the default.
const depth = (v, fallback) => (/^\d+$/.test(v ?? '') && Number(v) <= 20 ? Number(v) : fallback);

// '#/<page>?pick=a,b&view=<id>&up=3&down=2' -> { page, pick, view, up, down, unknown }. Pages: design (default), graph.
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
  return {
    page, pick, view: view && keep(view) ? view : null,
    up: depth(query.get('up'), DEFAULT_UP), down: depth(query.get('down'), DEFAULT_DOWN), unknown,
  };
}

export function buildHash(page, { pick = [], view = null, up = DEFAULT_UP, down = DEFAULT_DOWN } = {}) {
  const query = [];
  if (pick.length) query.push(`pick=${pick.join(',')}`);
  if (view) query.push(`view=${view}`);
  if (up !== DEFAULT_UP) query.push(`up=${up}`);
  if (down !== DEFAULT_DOWN) query.push(`down=${down}`);
  return `#/${page === 'graph' ? 'graph' : 'design'}${query.length ? `?${query.join('&')}` : ''}`;
}
