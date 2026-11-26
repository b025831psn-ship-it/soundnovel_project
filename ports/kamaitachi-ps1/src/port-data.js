const isUrlRoot = (root) => /^(?:https?:|file:)/.test(String(root)) || typeof window !== "undefined";

async function reader(root) {
  if (isUrlRoot(root)) {
    const base = new URL(String(root).replace(/\/?$/, "/"),
      typeof document === "undefined" ? import.meta.url : document.baseURI);
    const get = async (relative, json = false) => {
      const response = await fetch(new URL(relative, base));
      if (!response.ok) throw new Error(`port-data: ${relative} ${response.status}`);
      return json ? response.json() : new Uint8Array(await response.arrayBuffer());
    };
    return { root: base.href, json: (relative) => get(relative, true), bytes: (relative) => get(relative) };
  }
  const [{ readFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  const absolute = path.resolve(root);
  return { root: absolute,
    json: async (relative) => JSON.parse(await readFile(path.join(absolute, relative), "utf8")),
    bytes: async (relative) => new Uint8Array(await readFile(path.join(absolute, relative))) };
}

export async function loadPortData(root) {
  const source = await reader(root);
  const manifest = await source.json("manifest.json");
  if (manifest.schema !== "kamaitachi.ps1.port-data.v1") throw new Error(`unsupported port-data schema: ${manifest.schema}`);
  const sce = manifest.archives?.["SCE.PAC"];
  if (!sce) throw new Error("manifest has no SCE.PAC archive");
  const resources = new Map(sce.resources.map((resource) => [resource.id, resource]));
  const archives = new Map(Object.entries(manifest.archives || {}).map(([name, archive]) =>
    [name.toUpperCase(), new Map((archive.resources || []).map((resource) => [resource.id, resource]))]));
  return {
    root: source.root,
    manifest,
    resources,
    archives,
    async member(archiveName, resourceId) {
      const archive = archives.get(String(archiveName).toUpperCase());
      const resource = archive?.get(Number(resourceId));
      if (!resource) throw new Error(`missing ${archiveName} resource ${resourceId}`);
      return { resource, bytes: await source.bytes(resource.path) };
    },
    async record(resourceId, recordId) {
      const resource = resources.get(Number(resourceId));
      if (!resource) throw new Error(`missing SCE resource ${resourceId}`);
      const record = resource.records?.find((candidate) => candidate.id === Number(recordId));
      if (!record) throw new Error(`missing SCE resource ${resourceId} record ${recordId}`);
      return { resource, record, bytes: await source.bytes(record.path) };
    },
  };
}
