import { emptyDesign, clean, ACTIONS } from './design.js';

export const STORAGE_KEY = 'dse.design';
const UNDO_CAP = 100;

// File name for an exported design: slug of the name + .design.json
export const fileName = (design) =>
  `${design.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'design'}.design.json`;

export const serialize = (design) => JSON.stringify(design, null, 2) + '\n';

// The one place that holds the current design. Applies actions, keeps the undo stack (in memory only) and saves to
// `storage` (localStorage-like: getItem / setItem, may be null or throw) after every change.
// Notices: [{ kind: 'info' | 'error', text }], shown by the page until dismissed.
export function createStore(graph, { storage = null, key = STORAGE_KEY } = {}) {
  let design;
  const undoStack = [];
  const listeners = new Set();
  let notices = [];
  let canSave = true;

  const notify = (kind, text) => { notices = [...notices, { kind, text }]; };
  const emit = (change = {}) => listeners.forEach((fn) => fn(change));

  function save() {
    if (!canSave) return;
    try {
      storage.setItem(key, JSON.stringify(design));
    } catch {
      canSave = false;
      notify('error', 'Browser storage is not available: this design will not be kept after you close the page. Use Export to save it.');
    }
  }

  function load() {
    let text = null;
    try {
      if (!storage) throw new Error('no storage');
      text = storage.getItem(key);
    } catch {
      canSave = false;
      notify('error', 'Browser storage is not available: this design will not be kept after you close the page. Use Export to save it.');
    }
    design = emptyDesign();
    if (text == null) return;
    try {
      const loaded = clean(graph, JSON.parse(text));
      design = loaded.design;
      if (loaded.dropped.length) notify('info', `Dropped from the saved design: ${loaded.dropped.join('; ')}`);
    } catch (e) {
      notify('error', `The saved design could not be read (${e.message}); started a new one.`);
    }
  }

  function replace(next, change) {
    if (next === design) return false;
    undoStack.push(design);
    if (undoStack.length > UNDO_CAP) undoStack.shift();
    design = next;
    save();
    emit(change);
    return true;
  }

  // `action` is (graph, design) -> design. `quiet` tells listeners the change needs no full redraw (text field commits).
  const apply = (action, { quiet = false } = {}) => replace(action(graph, design), { quiet });

  const act = Object.fromEntries(Object.entries(ACTIONS).map(([name, fn]) =>
    [name, (...args) => apply((g, d) => fn(g, d, ...args), { quiet: name.startsWith('set') })]));

  load();
  return {
    get design() { return design; },
    get notices() { return notices; },
    get canUndo() { return undoStack.length > 0; },
    get persistent() { return canSave; },
    act,
    apply,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    undo() {
      if (!undoStack.length) return false;
      design = undoStack.pop();
      save();
      emit({});
      return true;
    },
    newDesign() { return replace(emptyDesign(), {}); },
    // Replaces the design with the one in `text` (an exported file). Returns { ok } or { ok: false, error }.
    importText(text) {
      let loaded;
      try {
        loaded = clean(graph, JSON.parse(text));
      } catch (e) {
        const error = e instanceof SyntaxError ? 'the file is not valid JSON' : e.message;
        notify('error', `Import failed: ${error}. The design is unchanged.`);
        emit({});
        return { ok: false, error };
      }
      if (loaded.dropped.length) notify('info', `Imported with changes. Dropped: ${loaded.dropped.join('; ')}`);
      replace(loaded.design, {});
      emit({});
      return { ok: true, dropped: loaded.dropped };
    },
    notify(kind, text) { notify(kind, text); emit({}); },
    dismissNotices() { notices = []; emit({}); },
  };
}
