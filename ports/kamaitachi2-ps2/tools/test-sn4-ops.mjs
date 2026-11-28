// Variable and condition semantics of Sn4Vm against the EE tables
// (calc 0x00219670, compare 0x002196B0). Uses a synthetic program only.
//   node ports/kamaitachi2-ps2/tools/test-sn4-ops.mjs
import assert from 'node:assert/strict';
import { CIPHER_SOLUTION, Sn4Vm, SN4_SPECIAL_EXECUTE, criminalNameIndex } from '../sn4.js';

const set = (v, op, value) => ({op: 0x68, offset: 0, args: [{var: v, op, value}]});
const copy = (v, op, source) => ({op: 0x69, offset: 0, args: [{var: v, op, source}]});
function run(ops, hooks = {}) {
  const vm = new Sn4Vm({entry: 'a', labels: [{label: 'a', offset: 0, ops}, {label: 'no', offset: 0, ops: []}]}, hooks);
  const event = vm.run();
  return {vm, event};
}
const value = (ops, v = 1) => run(ops).vm.variables.get(v);

assert.equal(value([set(1, 6, 10), set(1, 2, 3)]), 7, '2 subtracts');
assert.equal(value([set(1, 6, 10), set(1, 3, 3)]), 13, '3 adds');
assert.equal(value([set(1, 6, 10), set(1, 4, 3)]), 30, '4 multiplies');
assert.equal(value([set(1, 6, -7), set(1, 5, 2)]), -3, '5 divides toward zero');
assert.equal(value([set(1, 6, -7), set(1, 13, 3)]), -1, '13 keeps the dividend sign');
assert.equal(value([set(1, 6, 0x7fff), set(1, 3, 1)]), -0x8000, 'values are signed 16-bit');
assert.equal(value([set(2, 6, 5), set(1, 6, 1), copy(1, 3, 2)]), 6, '0x69 reads the source variable');
for (const draw of [0, 0.5, 0.999999]) {
  const original = Math.random;
  Math.random = () => draw;
  try { assert.equal(value([set(1, 14, 4)]), Math.floor(draw * 5), `14 draws 0..4 (${draw})`); }
  finally { Math.random = original; }
}
const unknown = [];
assert.equal(run([set(1, 6, 9), set(1, 0, 1)], {unknown: op => unknown.push(op)}).vm.variables.get(1), 9);
assert.deepEqual(unknown, [0x68], 'operators the EE rejects are reported');

// CommandIf runs the next command when true and jumps when false.
const cases = {6: [3, 3], 7: [3, 3], 8: [4, 3], 9: [2, 3], 10: [3, 3], 11: [3, 3], 12: [2, 3]};
for (const [cmp, [left, right]] of Object.entries(cases)) {
  const pass = run([set(1, 6, left), {op: 0x70, offset: 0, args: [{var: 1, cmp: +cmp, value: right, target: 'no'}]}]);
  assert.equal(pass.event.label, 'a', `cmp ${cmp} true falls through`);
  const fail = run([set(1, 6, left), {op: 0x70, offset: 0, args: [{var: 1, cmp: +cmp, value: right + (cmp === '8' || cmp === '10' ? 5 : cmp === '9' || cmp === '11' ? -5 : cmp === '12' ? -1 : 1), target: 'no'}]}]);
  assert.equal(fail.event.label, 'no', `cmp ${cmp} false jumps`);
}
const other = run([set(1, 6, 2), set(2, 6, 2), {op: 0x71, offset: 0, args: [{var: 1, cmp: 12, other: 2, target: 'no'}]}]);
assert.equal(other.event.label, 'no', '0x71 compares two variables');

// Every formerly unknown opcode is now tied to its EE command class. Hooks
// receive decoded operands plus source context instead of a generic unknown.
const classes = new Map([
  [0x10,'Name3'],[0x11,'Name4'],[0x17,'BgWait'],[0x1a,'Break'],[0x1b,'ManualJump'],
  [0x1f,'Cipher'],[0x23,'MiniGame'],[0x27,'End'],[0x28,'End'],[0x29,'AutoRead'],
  [0x2d,'SpiritJump'],[0x2e,'TMemory'],[0x2f,'MojiInOut'],[0x31,'MojiAfter'],
  [0x34,'RecordStart'],[0x35,'RecordEnd'],[0x3a,'InbouStart'],[0x3b,'InbouEnd'],
  [0x3c,'Center'],[0x3d,'MiniGameAreaStart'],[0x3e,'MiniGameAreaEnd'],[0x41,'Default'],
  [0x45,'Default'],[0x47,'MiniGameParam'],[0x48,'EventBox'],
  [0x54,'Default'],[0x56,'Default'],[0x57,'MojiInOutParam'],
  [0x59,'MojiAfterParam'],[0x5b,'MojiAllInOut'],[0x5e,'Default'],[0x60,'Default'],
  [0x62,'Default'],[0x64,'Default'],[0x76,'AddSelect'],[0x79,'AutoReadParam'],
  [0x7a,'ClickMap'],[0x7c,'PageLoopStart'],[0x7e,'Panel'],[0x7f,'DelusionPanel'],
  [0x81,'NameInputGeneral'],[0x82,'NameInputCriminal'],[0x83,'TMemorySave'],[0x84,'TMemoryLoad'],
]);
for (const [op, name] of classes) {
  const called = [];
  const interactiveArgs = {
    0x1f:[11], 0x7a:[{targets:['no']}],
    0x7e:[{panels:[0x4c],targets:['no'],fallback:'no'}],
    0x7f:[{targets:['no'],fallback:'no'}], 0x82:[{targets:['no']}],
  };
  const event = run([{op, offset:0x123, args:interactiveArgs[op] ?? [7]}], {
    command:(actual, args, context) => { called.push({actual,args,context}); return 0; },
  }).event;
  assert.equal(called[0].actual, name, `0x${op.toString(16)} dispatches ${name}`);
  assert.deepEqual(called[0].args, interactiveArgs[op] ?? [7]);
  assert.equal(called[0].context.offset, 0x123);
  assert.ok(['end','pause','break','special'].includes(event.type));
}

function specialVm(op, args, targets) {
  const labels = [{label:'a', offset:0, ops:[{op, offset:0x123, args}]}]
    .concat(targets.map(label => ({label, offset:0, ops:[]})));
  return new Sn4Vm({entry:'a', labels});
}
const mapVm = specialVm(0x7a, [{targets:['map0','map1']}], ['map0','map1']);
assert.equal(mapVm.run().kind, 'click-map');
assert.equal(mapVm.chooseSpecial(1).label, 'map1', 'click map selects the packed label index');
const panelVm = specialVm(0x7e, [{panels:[0x4c],targets:['panel0'],fallback:'panel-back'}], ['panel0','panel-back']);
assert.equal(panelVm.run().kind, 'panel');
assert.equal(panelVm.chooseSpecial(-1).label, 'panel-back', 'panel cancel uses the packed fallback');
const delusionVm = specialVm(0x7f, [{targets:['delusion0'],fallback:'delusion-back'}], ['delusion0','delusion-back']);
assert.equal(delusionVm.run().kind, 'delusion-panel');
assert.equal(delusionVm.chooseSpecial(0).label, 'delusion0');
const nameTargets = Array.from({length:25}, (_, i) => `name${i}`);
const nameVm = specialVm(0x82, [{mode:0, targets:nameTargets}], nameTargets);
nameVm.setNames(['とおる','まり']);
assert.equal(nameVm.run().kind, 'criminal-name');
assert.equal(nameVm.submitCriminalName('きょうこ').label, 'name15', 'correct criminal name selects group 15');
assert.equal(criminalNameIndex('トオル', ['とおる','まり']), 0, 'katakana player name is normalized');
const cipherVm = specialVm(0x1f, [11], []);
assert.equal(cipherVm.run().length, 12, 'cipher operand 11 is the final zero-based slot');
assert.equal(cipherVm.submitCipher([...CIPHER_SOLUTION]).type, 'end');
assert.equal(cipherVm.variables.get(230), 1, 'the original 12-button cipher sets v230');
const wrongCipherVm = specialVm(0x1f, [11], []);
wrongCipherVm.run(); wrongCipherVm.submitCipher(Array(12).fill('cross'));
assert.equal(wrongCipherVm.variables.get(230), 0, 'a wrong cipher leaves v230 clear');
const lines = [];
run([{op:0x4d, offset:0x123, args:[2,58]}], {line:(type, width, offset) => lines.push({type,width,offset})});
assert.deepEqual(lines, [{type:2, width:58, offset:0}], '0x4d dispatches the EE line operands');
const spacing = [];
run([{op:0x53, offset:0x123, args:[7]}], {letterSpacing:(value, offset) => spacing.push({value,offset})});
assert.deepEqual(spacing, [{value:7, offset:0}], '0x53 sets EE letter spacing');
const cancelable = run([{op:0x51, offset:3, args:[45]}]).event;
assert.deepEqual(cancelable, {type:'wait', reason:'cancelable', label:'a', offset:3, ticks:45, text:''});
let pageClears = 0;
const pageBreak = run([{op:0x02, offset:0, args:['old']}, {op:0x0c, offset:4, args:[]},
  {op:0x02, offset:5, args:['new']}, {op:0x09, offset:8, args:[]}],
  {clearText:() => pageClears++}).event;
assert.equal(pageClears, 1, '0x0c clears the message window immediately');
assert.deepEqual(pageBreak, {type:'pause', label:'a', offset:8, text:'new'},
  '0x0c continues without an empty input wait');
const effectWait = run([{op:0x15, offset:5, args:[]}], {mojiSync:() => 3}).event;
assert.deepEqual(effectWait, {type:'wait', reason:'text-effect', label:'a', offset:5, ticks:3, text:''});
const ruby = [];
run([{op:0x02, offset:0, args:['底']}, {op:0x106, offset:1, args:['　',['そ']]}],
  {ruby:(word, readings, offset) => ruby.push({word,readings,offset})});
assert.deepEqual(ruby, [{word:'　', readings:['そ'], offset:1}], 'ruby keeps its absolute text offset');
assert.equal(classes.size + 3, 47, 'all 47 formerly unknown opcodes are covered');
assert.equal(Object.keys(SN4_SPECIAL_EXECUTE).length, 37, 'all 37 EE special commands have Execute addresses');
assert.ok(Object.values(SN4_SPECIAL_EXECUTE).every(address => address >= 0x100000), 'special Execute addresses are EE VAs');
console.log('sn4 variable/condition semantics: PASS');
