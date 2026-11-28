// Generic save/restore of an emulator object graph for save states.
// captureState walks own fields: numbers, strings, booleans and null are copied, typed arrays
// are copied, arrays and objects are walked. Functions (callbacks) are left out, so restoring
// keeps the live callbacks. An object reached twice is stored once; restoreState writes the
// values back into the same live objects (typed arrays with .set), which keeps shared buffers
// such as the S-DSP's view of ARAM shared.
const isTyped = (v) => ArrayBuffer.isView(v) && !(v instanceof DataView);

export function captureState(root, { skip = [] } = {}) {
  const seen = new Set(skip);
  const walk = (v) => {
    if (v === null || typeof v !== 'object') return typeof v === 'function' ? undefined : v;
    if (seen.has(v)) return undefined;
    seen.add(v);
    if (isTyped(v)) return v.slice();
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const k of Object.keys(v)) { const s = walk(v[k]); if (s !== undefined) out[k] = s; }
    return out;
  };
  return walk(root);
}

export function restoreState(root, state, { skip = [] } = {}) {
  const seen = new Set(skip);
  const walk = (live, s) => {
    if (seen.has(live)) return;
    seen.add(live);
    if (isTyped(live)) { live.set(s); return; }
    for (const k of Object.keys(s)) {
      const cur = live[k], val = s[k];
      if (typeof cur === 'function') continue;
      if (cur !== null && typeof cur === 'object' && val !== null && typeof val === 'object') {
        if (Array.isArray(cur) && Array.isArray(val) && cur.length !== val.length) live[k] = structuredClone(val);
        else walk(cur, val);
      } else live[k] = val !== null && typeof val === 'object' ? structuredClone(val) : val;
    }
  };
  walk(root, state);
}
