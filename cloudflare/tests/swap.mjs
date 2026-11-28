// node --import ./swap.mjs: the save tests' "../server/server.mjs" becomes the D1 double.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`export async function resolve(s, c, next) {
  if (s.endsWith("/server/server.mjs") && c.parentURL?.includes("/shared/save/tests/")) return next(${JSON.stringify(new URL("./d1-server.mjs", import.meta.url).href)}, c);
  return next(s, c); }`));
