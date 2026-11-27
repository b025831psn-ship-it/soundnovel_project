const isTypedArray = value => ArrayBuffer.isView(value) && !(value instanceof DataView);

function captureValue(value, omit) {
  if (value == null || typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'function') return undefined;
  if (isTypedArray(value)) return value.slice();
  if (value instanceof Set) return new Set([...value].map(item => captureValue(item, omit)));
  if (Array.isArray(value)) return value.map(item => captureValue(item, omit));
  const state = {};
  for (const [key, item] of Object.entries(value)) {
    if (omit.has(key)) continue;
    const saved = captureValue(item, omit);
    if (saved !== undefined) state[key] = saved;
  }
  return state;
}

function restoreValue(target, state) {
  if (isTypedArray(target)) {
    if (!isTypedArray(state) || target.length !== state.length) throw new Error('state typed-array mismatch');
    target.set(state); return target;
  }
  if (Array.isArray(target)) {
    if (!Array.isArray(state)) throw new Error('state array mismatch');
    if (target.length === state.length && target.every(item => item && typeof item === 'object')) {
      for (let index = 0; index < target.length; index++) restoreValue(target[index], state[index]);
    } else {
      target.length = 0;
      for (const item of state) target.push(captureValue(item, new Set()));
    }
    return target;
  }
  if (target instanceof Set) {
    if (!(state instanceof Set)) throw new Error('state set mismatch');
    target.clear();
    for (const item of state) target.add(captureValue(item, new Set()));
    return target;
  }
  if (target && typeof target === 'object' && state && typeof state === 'object') {
    for (const [key, value] of Object.entries(state)) {
      const current = target[key];
      if (current && typeof current === 'object') restoreValue(current, value);
      else target[key] = captureValue(value, new Set());
    }
    return target;
  }
  return state;
}

const CPU_OMIT = new Set(['bus', 'onNmi', 'trace']);
const BUS_OMIT = new Set(['rom', 'program', 'masterLink', 'clock', 'ppu', 'trace', 'inputFrames',
  'onProgramRead', 'onSramWrite', 'onJoypadRead', 'onNmi', 'onDma']);
const PPU_OMIT = new Set(['onFrame', 'frame', 'renderedRevision', 'tileEpoch', 'tileValid2', 'tilePixels2', 'tileValid4', 'tilePixels4',
  'tileValid8', 'tilePixels8', 'mode1LayerKeys', 'mode1Layers', 'objectLayerKey', 'objectLayer']);
const LINK_OMIT = new Set(['apu', 'readPoint', 'writeLag']);
const APU_CPU_OMIT = new Set(['dsp', 'ipl', 'onDspWrite', 'onPortWrite', 'onPortRead']);
const DSP_OMIT = new Set(['ram', 'gauss', 'onSample']);

export function saveVmState(vm) {
  const link = vm.bus.masterLink, apu = link?.apu;
  return {
    format: 'zakuro-vm-state', version: 1,
    vm: { nmiTriggerMaster: vm.nmiTriggerMaster, skipRender: vm.skipRender },
    cpu: captureValue(vm.cpu, CPU_OMIT),
    bus: captureValue(vm.bus, BUS_OMIT),
    clock: captureValue(vm.bus.clock, new Set()),
    ppu: captureValue(vm.ppu, PPU_OMIT),
    link: apu ? captureValue(link, LINK_OMIT) : null,
    apuCpu: apu ? captureValue(apu.cpu, APU_CPU_OMIT) : null,
    dsp: apu ? captureValue(apu.dsp, DSP_OMIT) : null,
  };
}

export function loadVmState(vm, state) {
  if (state?.format !== 'zakuro-vm-state' || state.version !== 1) throw new Error('unsupported Zakuro VM state');
  const link = vm.bus.masterLink, apu = link?.apu;
  if (!!state.link !== !!apu) throw new Error('state APU configuration mismatch');
  restoreValue(vm.cpu, state.cpu); restoreValue(vm.bus, state.bus);
  restoreValue(vm.bus.clock, state.clock); restoreValue(vm.ppu, state.ppu);
  if (apu) {
    restoreValue(link, state.link); restoreValue(apu.cpu, state.apuCpu); restoreValue(apu.dsp, state.dsp);
  }
  vm.nmiTriggerMaster = state.vm.nmiTriggerMaster;
  vm.skipRender = state.vm.skipRender;
  vm.ppu.tileValid2?.fill(0); vm.ppu.tileValid4?.fill(0); vm.ppu.tileValid8?.fill(0);
  if ('tileEpoch' in vm.ppu) vm.ppu.tileEpoch = 1;
  vm.ppu.mode1LayerKeys = []; vm.ppu.mode1Layers = [];
  vm.ppu.objectLayerKey = null; vm.ppu.objectLayer = null; vm.ppu.renderedRevision = -1;
  return vm;
}
