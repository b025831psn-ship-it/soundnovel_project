// The administrator launches each player in a same-origin frame. The private
// endpoint checks credentials separately before returning a save.
export async function fetchDebugSave(port, extension) {
  if (new URLSearchParams(location.search).get("debug") !== "1" || parent === window) return null;
  try {
    if (parent.location.origin !== location.origin || !parent.location.pathname.startsWith("/edit/admin/")) return null;
  } catch { return null; } // A cross-origin frame cannot be the administrator.
  const response = await fetch(`/edit/${port}/debug-save.${extension}`, {
    cache: "no-store", headers: { "X-Quiet-Auth": "1" },
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`디버그 세이브를 읽을 수 없습니다 (HTTP ${response.status}).`);
  return response;
}
