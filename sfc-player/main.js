const DATA_ROOT = '/kamaitachi-sfc-kor/port-data';
const canvas = document.querySelector('#screen');
const context = canvas.getContext('2d', { alpha: false });
const status = document.querySelector('#status');
const start = document.querySelector('#start');
let manifest;
let stateIndex = 0;

function rgb565(bytes, width, height) {
  const image = context.createImageData(width, height);
  for (let source = 0, target = 0; source < bytes.length; source += 2, target += 4) {
    const value = bytes[source] | bytes[source + 1] << 8;
    image.data[target] = Math.round((value & 31) * 255 / 31);
    image.data[target + 1] = Math.round((value >> 5 & 63) * 255 / 63);
    image.data[target + 2] = Math.round((value >> 11 & 31) * 255 / 31);
    image.data[target + 3] = 255;
  }
  return image;
}

async function loadState(index) {
  const state = manifest.states[index];
  const path = manifest.files.frame.replace('{id}', state.id);
  const response = await fetch(`${DATA_ROOT}/${path}`);
  if (!response.ok) throw new Error(`추출 데이터 로드 실패 (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  context.putImageData(rgb565(bytes, manifest.video.width, manifest.video.height), 0, 0);
  stateIndex = index;
  status.textContent = `${state.label} · ROM 없이 원본 추출 데이터를 실행 중`;
}

async function advance() {
  if (!manifest) return;
  start.disabled = true;
  try { await loadState((stateIndex + 1) % manifest.states.length); }
  finally { start.disabled = false; }
}

async function boot() {
  const response = await fetch(`${DATA_ROOT}/manifest.json`);
  if (!response.ok) throw new Error(`port-data manifest를 찾지 못했습니다 (${response.status})`);
  manifest = await response.json();
  canvas.width = manifest.video.width;
  canvas.height = manifest.video.height;
  await loadState(0);
  start.disabled = false;
}

start.addEventListener('click', advance);
addEventListener('keydown', event => {
  if (['Enter', ' ', 'x', 'X', 's', 'S'].includes(event.key)) {
    event.preventDefault();
    advance();
  }
});

boot().catch(error => { status.textContent = error.message; });
