import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadPortData(root) {
  const absolute = path.resolve(root);
  const manifest = JSON.parse(await readFile(path.join(absolute, "manifest.json"), "utf8"));
  if (manifest.schema !== "kamaitachi.ps1.port-data.v1") throw new Error(`unsupported port-data schema: ${manifest.schema}`);
  const sce = manifest.archives?.["SCE.PAC"];
  if (!sce) throw new Error("manifest has no SCE.PAC archive");
  const resources = new Map(sce.resources.map((resource) => [resource.id, resource]));
  const archives = new Map(Object.entries(manifest.archives || {}).map(([name, archive]) =>
    [name.toUpperCase(), new Map((archive.resources || []).map((resource) => [resource.id, resource]))]));
  return {
    root: absolute,
    manifest,
    resources,
    archives,
    async member(archiveName, resourceId) {
      const archive = archives.get(String(archiveName).toUpperCase());
      const resource = archive?.get(Number(resourceId));
      if (!resource) throw new Error(`missing ${archiveName} resource ${resourceId}`);
      return { resource, bytes: new Uint8Array(await readFile(path.join(absolute, resource.path))) };
    },
    async record(resourceId, recordId) {
      const resource = resources.get(Number(resourceId));
      if (!resource) throw new Error(`missing SCE resource ${resourceId}`);
      const record = resource.records?.find((candidate) => candidate.id === Number(recordId));
      if (!record) throw new Error(`missing SCE resource ${resourceId} record ${recordId}`);
      return { resource, record, bytes: new Uint8Array(await readFile(path.join(absolute, record.path))) };
    },
  };
}
