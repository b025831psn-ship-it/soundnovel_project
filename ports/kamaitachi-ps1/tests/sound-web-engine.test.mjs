// The browser sound engine renders exactly what the oracle-checked JS library renders
// for the same calls. Needs the user's files: set PS1_SOUND_DIR (skipped otherwise).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { Ps1SoundEngine, SAMPLES_PER_FRAME } from "../sound/web/engine.js";
import { JsSs } from "../sound/lib/ss.js";
import { SoundModule } from "../sound/module.js";
import { memberLoader } from "../sound/members.js";
import { readSoundTables } from "../sound/container.js";

const D = process.env.PS1_SOUND_DIR;
test("engine output = module on JsSs, frame for frame", { skip: !D || !existsSync(D + "/MUS.PAC") }, () => {
  const pacs = Object.fromEntries(["MUS", "VCE", "VCP", "BIN"].map((k) => [k, new Uint8Array(readFileSync(`${D}/${k}.PAC`))]));
  const tables = JSON.parse(JSON.stringify(readSoundTables(readFileSync(D + "/SLPS_017.94")), (k, v) => v instanceof Uint8Array ? Array.from(v) : v));
  const frames = 180;
  // reference: the same loop compare-hybrid runs
  const js = new JsSs(), mod = new SoundModule(js.ss, tables, { loadMember: memberLoader(pacs) });
  mod.reset();
  const skip = js.out.reduce((n, b) => n + b.length / 2, 0);
  mod.play(1, 0); mod.play(1005, 0);
  for (let f = 0; f < frames; f++) { mod.vsync(); mod.frame(); js.frame(1); }
  const ref = js.pcm().subarray(skip * 2);
  // engine, pulled in odd-sized chunks like the audio thread
  const e = new Ps1SoundEngine({ tables, pacs });
  const L = new Float32Array(skip), R = new Float32Array(skip);
  e.pull(L, R);
  e.command("play", [1, 0]); e.command("play", [1005, 0]);
  const n = ref.length / 2, l = new Float32Array(n), r = new Float32Array(n);
  for (let o = 0; o < n; o += 128) e.pull(l.subarray(o, Math.min(n, o + 128)), r.subarray(o, Math.min(n, o + 128)));
  let bad = -1;
  for (let i = 0; i < n; i++) if (Math.round(l[i] * 32768) !== ref[2 * i] || Math.round(r[i] * 32768) !== ref[2 * i + 1]) { bad = i; break; }
  assert.equal(bad, -1, `first sample difference at ${bad}`);
  assert.ok(ref.some((x) => x !== 0), "rendered something");
  assert.ok(n >= frames * SAMPLES_PER_FRAME);
});
