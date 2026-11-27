import { connect } from './pp.mjs'; import { writeFileSync } from 'node:fs'; import { execFileSync } from 'node:child_process';
const pp = await connect(); const S = process.env.S || ".";
const grab = async name => { const r = await pp.send('memory.read', { address: 0x04000000, size: 0x88000 }); writeFileSync(`${S}/v.bin`, Buffer.from(r.base64, 'base64')); execFileSync('python3', [`${S}/cap.py`, `${S}/v.bin`, `${S}/${name}.png`]); };
const steps = process.argv.slice(2);
for (const s of steps) { const [k, v] = s.split(':'); if (k === 'p') await pp.press(v); else if (k === 'w') await pp.wait(+v); else if (k === 'g') await grab(v); }
pp.close();
