import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ScenarioVM } from '../src/scenario-vm.mjs';

const source = readFileSync(fileURLToPath(new URL('../src/scenario-vm.mjs', import.meta.url)), 'utf8');
const cases = new Set([...source.matchAll(/case 0x([0-9a-f]+):/gi)].map((match) => parseInt(match[1], 16)));
assert.deepEqual([...cases].sort((a, b) => a - b), Array.from({ length: 0x15 }, (_, index) => index));

const unsupported = new ScenarioVM(Uint8Array.of(0x40, 0x15), new Uint8Array(1), null);
assert.throws(() => unsupported.step(), /Unsupported scenario opcode 0x15 at 0/);

console.log('시나리오 opcode 21/21 및 범위 밖 실패 검사 통과');
