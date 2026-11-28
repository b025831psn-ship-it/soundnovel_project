import assert from 'node:assert/strict';
import { PSYCHOMETRY_GRID, psychometryRegion } from '../psychometry-grid.js';

assert.equal(PSYCHOMETRY_GRID.length, 952);
assert.deepEqual([...new Set(PSYCHOMETRY_GRID.map(([, , region]) => region))].sort((a, b) => a - b),
  [0,1,2,3,4,5,6,7,8,9]);
for (const [x, y, region] of PSYCHOMETRY_GRID)
  assert.equal(psychometryRegion(x, y), region, `${x},${y}`);
assert.equal(psychometryRegion(134, 220), 0);
assert.notEqual(psychometryRegion(136, 220), 0);
assert.notEqual(psychometryRegion(134, 219), 0);
console.log('psychometry grid: 952/952 measured points pass');
