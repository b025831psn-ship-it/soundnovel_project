import Snes9xSDK from '/vendor/snes9x/snes9x.sdk.js';

const EXPECTED_SIZE = 3_145_728;
const EXPECTED_SHA256 = '3228a3b35f7d234a7bf91f8159ccc56518199222e84d258c14a153f54f9fcbc7';
const picker = document.querySelector('#rom');
const stage = document.querySelector('#stage');
const status = document.querySelector('#status');
let play;

const hex = (bytes) => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');

async function verify(file) {
  if (file.size !== EXPECTED_SIZE)
    throw new Error(`지원하지 않는 ROM 크기입니다 (${file.size.toLocaleString()} bytes).`);
  const bytes = await file.arrayBuffer();
  const sha256 = hex(await crypto.subtle.digest('SHA-256', bytes));
  if (sha256 !== EXPECTED_SHA256)
    throw new Error(`지원하지 않는 판본입니다 (SHA-256 ${sha256}).`);
  return bytes;
}

picker.addEventListener('change', async () => {
  const file = picker.files?.[0];
  if (!file) return;
  picker.disabled = true;
  status.textContent = '판본과 SHA-256을 확인하는 중…';
  try {
    const bytes = await verify(file);
    if (play) await play.destroy();
    stage.replaceChildren();
    status.textContent = 'SFC 하드웨어 코어를 시작하는 중…';
    play = await new Snes9xSDK()
      .options({ region: 'ntsc', aspect: '4:3', cropOverscan: true, renderFilter: 'pixelated' })
      .assets({ rom: bytes })
      .storage({ namespace: `kamaitachi-sfc-${EXPECTED_SHA256.slice(0, 12)}` })
      .mount(stage)
      .start();
    status.textContent = '원본 ROM 실행 중 · 화면을 클릭한 뒤 키보드로 조작하세요.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    picker.disabled = false;
  }
});

addEventListener('pagehide', () => play?.destroy());
