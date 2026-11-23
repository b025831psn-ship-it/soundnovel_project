// Normalizes a story JSON into the shape the player uses.
// The player never hard-codes node IDs or titles: everything comes from here.
//
// Accepted input (see README.md for the full format):
//   { schemaVersion, gameId, title?, entry, scenes?, nodes }
//   nodes: object keyed by id, or an array of nodes that each carry `id`.
//   choice node: { scene?, question, options: [{ key?, label, to }] }
//   text node:   { scene?, pages: [page, ...], to? }
//   page: array of sentences, a single sentence string,
//         or an object with `lines` / `sentences` / `text`.

export class StoryFormatError extends Error {}

function firstDefined(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizePage(page, where) {
  if (typeof page === 'string') return [page];
  if (Array.isArray(page)) return page.map((s, i) => toSentence(s, `${where}[${i}]`));
  if (page && typeof page === 'object') {
    const lines = firstDefined(page, ['lines', 'sentences', 'text']);
    if (lines !== undefined) return normalizePage(lines, where);
  }
  throw new StoryFormatError(`${where}: 문장 목록을 읽을 수 없습니다.`);
}

function toSentence(s, where) {
  if (typeof s === 'string') return s;
  if (s && typeof s === 'object') {
    const t = firstDefined(s, ['text', 'target', 'ko']);
    if (typeof t === 'string') return t;
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
    if (Array.isArray(options)) {
      nodes[id] = {
        id,
        kind: 'choice',
        scene,
        question: String(firstDefined(n, ['question', 'prompt', 'text']) ?? ''),
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

  return {
    schemaVersion,
    gameId: String(gameId),
    title: String(raw.title || gameId),
    entry,
    scenes,
    nodes,
  };
}
