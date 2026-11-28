// Normalizes a story JSON into the shape the player uses.
// The player never hard-codes node IDs or titles: everything comes from here.
//
// Accepted input (see README.md for the full format):
//   { schemaVersion, gameId, title?, entry, scenes?, nodes }
//   nodes: object keyed by id, or an array of nodes that each carry `id`.
//   choice node: { kind?: "choice", scene?, text | question, options: [{ key?, label, to }] }
//   text node:   { kind?: "passage", scene?, pages: [page, ...], to? }
//   `kind` decides the node type when present; otherwise `options` means a choice.
//   page: array of sentences, a single sentence, or an object with `lines` / `sentences`.
//   sentence: a string, or { ko | text | target, ja? } when the original Japanese is included.
//   Sentences are normalized to { ko, ja } (ja is null when there is no original).

export class StoryFormatError extends Error {}

function firstDefined(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function isSentenceObject(page) {
  return page && typeof page === 'object' && !Array.isArray(page)
    && firstDefined(page, ['lines', 'sentences']) === undefined
    && (typeof page.ko === 'string' || typeof page.target === 'string' || typeof page.text === 'string');
}

function normalizePage(page, where) {
  if (typeof page === 'string' || isSentenceObject(page)) return [toSentence(page, where)];
  if (Array.isArray(page)) return page.map((s, i) => toSentence(s, `${where}[${i}]`));
  if (page && typeof page === 'object') {
    const lines = firstDefined(page, ['lines', 'sentences', 'text']);
    if (lines !== undefined) return normalizePage(lines, where);
  }
  throw new StoryFormatError(`${where}: 문장 목록을 읽을 수 없습니다.`);
}

function toSentence(s, where) {
  if (typeof s === 'string') return { ko: s, ja: null };
  if (s && typeof s === 'object') {
    const ko = firstDefined(s, ['ko', 'text', 'target']);
    const ja = firstDefined(s, ['ja', 'source', 'original']);
    if (typeof ko === 'string') return { ko, ja: typeof ja === 'string' && ja ? ja : null };
  }
  throw new StoryFormatError(`${where}: 문장이 문자열이 아닙니다.`);
}

function sceneId(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'object') return String(firstDefined(raw, ['id', 'name']) ?? '');
  return String(raw);
}

export function normalizeStory(raw) {
  if (!raw || typeof raw !== 'object') throw new StoryFormatError('JSON 최상위가 객체가 아닙니다.');
  const { schemaVersion, gameId, entry } = raw;
  if (schemaVersion === undefined) throw new StoryFormatError('schemaVersion이 없습니다.');
  if (!gameId) throw new StoryFormatError('gameId가 없습니다.');
  if (!entry) throw new StoryFormatError('entry가 없습니다.');

  const nodeList = Array.isArray(raw.nodes)
    ? raw.nodes.map((n) => [n.id, n])
    : Object.entries(raw.nodes || {});
  if (!nodeList.length) throw new StoryFormatError('nodes가 비어 있습니다.');

  const scenes = {};
  const rawScenes = raw.scenes || {};
  for (const [id, s] of Array.isArray(rawScenes) ? rawScenes.map((s) => [s.id, s]) : Object.entries(rawScenes)) {
    scenes[id] = { id, name: (s && (s.name || s.label)) || id };
  }

  const nodes = {};
  for (const [id, n] of nodeList) {
    if (!id) throw new StoryFormatError('id가 없는 노드가 있습니다.');
    const scene = sceneId(n.scene);
    if (scene && !scenes[scene]) {
      const name = typeof n.scene === 'object' ? (n.scene.name || scene) : scene;
      scenes[scene] = { id: scene, name };
    }
    const options = firstDefined(n, ['options', 'choices']);
    const isChoice = n.kind ? n.kind === 'choice' : Array.isArray(options);
    if (isChoice) {
      if (!Array.isArray(options) || !options.length) throw new StoryFormatError(`${id}: 선택지 노드에 options가 없습니다.`);
      nodes[id] = {
        id,
        kind: 'choice',
        scene,
        question: toSentence(firstDefined(n, ['question', 'prompt', 'text']) ?? '', `${id}.text`),
        options: options.map((o, i) => ({
          key: String(firstDefined(o, ['key', 'id']) ?? String.fromCharCode(65 + i)),
          label: toSentence(firstDefined(o, ['label', 'text']) ?? '', `${id}.options[${i}].label`),
          to: o.to ?? null,
        })),
      };
    } else {
      const pages = firstDefined(n, ['pages']);
      if (!Array.isArray(pages) || !pages.length) {
        throw new StoryFormatError(`${id}: options나 pages가 필요합니다.`);
      }
      nodes[id] = {
        id,
        kind: 'text',
        scene,
        pages: pages.map((p, i) => normalizePage(p, `${id}.pages[${i}]`)),
        to: n.to ?? null,
      };
    }
  }

  if (!nodes[entry]) throw new StoryFormatError(`entry "${entry}" 노드가 없습니다.`);
  for (const n of Object.values(nodes)) {
    const targets = n.kind === 'choice' ? n.options.map((o) => o.to) : [n.to];
    for (const t of targets) {
      if (t !== null && !nodes[t]) throw new StoryFormatError(`${n.id}: 이동할 노드 "${t}"가 없습니다.`);
    }
  }

  const hasOriginal = Object.values(nodes).some((n) => (n.kind === 'choice'
    ? [n.question, ...n.options.map((o) => o.label)]
    : n.pages.flat()).some((t) => t.ja));

  // Optional default names and [n] token values, e.g. { "0": "민준", "1": "마리" }.
  const nameTokens = raw.names && typeof raw.names === 'object' && !Array.isArray(raw.names)
    ? Object.fromEntries(Object.entries(raw.names).filter(([, v]) => typeof v === 'string' && v))
    : {};
  const names = Object.values(nameTokens);

  return {
    schemaVersion,
    hasOriginal,
    names,
    nameTokens,
    gameId: String(gameId),
    title: String(raw.title || gameId),
    entry,
    scenes,
    nodes,
  };
}
