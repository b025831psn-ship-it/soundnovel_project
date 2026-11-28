import fs from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('usage: node build-psychometry-grid.mjs <tsv|-> <output.js>');
const source = input === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(input, 'utf8');
const points = source.split(/\r?\n/)
  .filter(line => line && !line.startsWith('#') && !/^x\s+y\s+region$/.test(line))
  .map(line => line.trim().split(/\s+/).map(Number));
if (points.length !== 952 || points.some(row => row.length !== 3 || row.some(Number.isNaN)))
  throw new Error(`expected 952 measured points, found ${points.length}`);
if (points.filter(([, , region]) => region === 0).some(([x, y]) => x < 133 || x > 135 || y !== 220))
  throw new Error('region 0 escaped the measured 133..135,220 range');

const body = `// Generated from private QA commit a3f41b1 (qa/psychometry-grid.tsv).\n` +
`// Coordinates not present in the EE trace are classified by their nearest measured point.\n` +
`export const PSYCHOMETRY_GRID = Object.freeze(${JSON.stringify(points)});\n\n` +
`export function psychometryRegion(x, y) {\n` +
`  if (y === 220 && x >= 133 && x <= 135) return 0;\n` +
`  let region = 9, best = Infinity;\n` +
`  for (const [px, py, candidate] of PSYCHOMETRY_GRID) {\n` +
`    if (candidate === 0) continue;\n` +
`    const distance = (x - px) ** 2 + (y - py) ** 2;\n` +
`    if (distance < best) { best = distance; region = candidate; }\n` +
`  }\n` +
`  return region;\n` +
`}\n`;
fs.writeFileSync(output, body);
