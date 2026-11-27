// PPSSPP WebSocket debugger driver (headless). Usage as a module or CLI: node pp.mjs shot out.png | press cross | wait 2
import { writeFileSync } from 'node:fs';
export async function connect(port = +(process.env.PORT || 45458)) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/debugger`, 'debugger.ppsspp.org');
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  const waiters = []; let id = 0;
  ws.onmessage = e => { const m = JSON.parse(e.data); for (let i = 0; i < waiters.length; i++) if (waiters[i].match(m)) { waiters.splice(i, 1)[0].ok(m); break; } };
  const send = (event, args = {}, waitFor) => new Promise(ok => {
    const ticket = String(++id);
    waiters.push({ ok, match: m => (m.ticket === ticket) || (waitFor && m.event === waitFor) || (m.event === 'error' && m.ticket === ticket) });
    ws.send(JSON.stringify({ event, ticket, ...args }));
  });
  const api = {
    send, close: () => ws.close(),
    async pause() { const st = await send('cpu.status'); if (!st.stepping) await send('cpu.stepping', {}, 'cpu.stepping'); },
    async resume() { await send('cpu.resume', {}, 'cpu.resume'); },
    async shot(path) { await api.pause(); const r = await send('gpu.buffer.renderColor', { type: 'uri' }); await api.resume(); if (r.uri) writeFileSync(path, Buffer.from(r.uri.split(',')[1], 'base64')); return r; },
    async press(button, ms = +(process.env.PRESS_MS || 120)) { await send('input.buttons.press', { button, duration: Math.max(1, Math.round(ms * 60 / 1000)) }); },
    wait: s => new Promise(ok => setTimeout(ok, s * 1000)),
  };
  return api;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const pp = await connect(); const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const c = a[i];
    if (c === 'shot') { const r = await pp.shot(a[++i]); console.log('shot', r.event, r.width ?? '', r.height ?? '', r.message ?? ''); }
    else if (c === 'press') { await pp.press(a[++i]); console.log('press', a[i]); }
    else if (c === 'wait') await pp.wait(+a[++i]);
    else if (c === 'status') console.log(JSON.stringify(await pp.send('cpu.status')));
  }
  pp.close();
}
