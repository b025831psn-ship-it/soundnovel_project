import fs from "node:fs";
const args = process.argv.slice(2);
const ignoreFrame = args.includes("--ignore-frame");
const paths = args.filter((arg) => arg !== "--ignore-frame");
if (paths.length !== 2)
  throw new Error("usage: compare-traces.mjs [--ignore-frame] mgba.tsv js.tsv");
function rows(path) {
  return fs
    .readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .map((line) => {
      const fields = line.split("\t");
      if (ignoreFrame) fields.shift();
      return fields.join("\t");
    });
}
const expected = rows(paths[0]);
const actual = rows(paths[1]);
let differences = 0;
for (let index = 0; index < Math.max(expected.length, actual.length); index++) {
  if (expected[index] === actual[index]) continue;
  console.log(
    `${index + 1}\n- ${expected[index] ?? "<missing>"}\n+ ${actual[index] ?? "<missing>"}`,
  );
  if (++differences === 100) break;
}
process.exitCode = differences ? 1 : 0;
