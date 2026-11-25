// The contract a port implements (see docs/save/README.md) and the load pipeline that uses it.
//   codec.slots(), codec.encode(snapshot, ctx), codec.validate(payload, schema),
//   codec.migrate(payload, fromSchema), codec.decode(payload, ctx), codec.summarize(payload, ctx)
// Failures are results, never exceptions: { ok: false, reason }.

export const REASON = {
  missing: "missing",
  unsupportedSchema: "unsupportedSchema",
  incompatibleDataVersion: "incompatibleDataVersion",
  corrupt: "corrupt",
};

export function saveSlot(store, codec, slotId, snapshot, ctx = {}) {
  const desc = codec.slots().find((s) => s.id === slotId);
  if (!desc || desc.canWrite === false) return { ok: false, reason: "readonly" };
  const payload = codec.encode(snapshot, ctx);
  const env = store.write(codec.gameId, slotId, {
    schema: codec.currentSchema,
    dataVersion: codec.dataVersion ?? 1,
    edition: ctx.edition ?? "ja",
    label: codec.summarize(payload, ctx)?.title ?? "",
    payload,
  });
  return { ok: true, envelope: env };
}

// validate -> migrate -> decode. Never throws for bad data.
export function loadSlot(store, codec, slotId, ctx = {}) {
  const env = store.read(codec.gameId, slotId);
  if (!env) return { ok: false, reason: REASON.missing };
  if (env.schema > codec.currentSchema) return { ok: false, reason: REASON.unsupportedSchema };
  if ((codec.dataVersion ?? 1) !== env.dataVersion) return { ok: false, reason: REASON.incompatibleDataVersion };
  try {
    let payload = env.payload;
    let schema = env.schema;
    const before = codec.validate(payload, schema);
    if (before && before.ok === false) return { ok: false, reason: before.reason ?? REASON.corrupt };
    if (schema < codec.currentSchema) {
      const m = codec.migrate(payload, schema);
      if (!m || m.ok === false) return { ok: false, reason: m?.reason ?? REASON.unsupportedSchema };
      payload = m.payload; schema = codec.currentSchema;
      const after = codec.validate(payload, schema);
      if (after && after.ok === false) return { ok: false, reason: after.reason ?? REASON.corrupt };
    }
    const decoded = codec.decode(payload, ctx);
    if (!decoded || decoded.ok === false) return { ok: false, reason: decoded?.reason ?? REASON.corrupt };
    return { ok: true, state: decoded.state, envelope: env };
  } catch {
    return { ok: false, reason: REASON.corrupt };
  }
}

// What the slot list shows for each slot, in the codec's order. Unreadable slots are marked, never removed.
export function summarizeSlots(store, codec, ctx = {}) {
  return codec.slots().map((desc) => {
    const env = store.read(codec.gameId, desc.id);
    if (!env) return { desc, used: false };
    try {
      const s = codec.summarize(env.payload, ctx);
      return { desc, used: true, summary: s, readable: loadSlotReadable(codec, env) };
    } catch { return { desc, used: true, readable: false }; }
  });
}

function loadSlotReadable(codec, env) {
  return env.schema <= codec.currentSchema && (codec.dataVersion ?? 1) === env.dataVersion;
}
