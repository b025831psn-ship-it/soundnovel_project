const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const routes = new Map([
  ['/', [path.join(__dirname, 'index.html'), 'text/html; charset=utf-8']],
  ...['kamaitachi', 'higanbana'].flatMap(slug => [
    ['/play/' + slug + '/', [path.join(__dirname, 'play.html'), 'text/html; charset=utf-8']],
    ['/art/' + slug + '.png', [path.join(__dirname, 'art', slug + '.png'), 'image/png']]
  ]),
  ...['index.html', 'main.js', 'player.js', 'story.js', 'player.css', 'data/sample.ko.json'].map(file => {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    return ['/web-player/' + file, [path.join(__dirname, 'web-player', file), types[path.extname(file)] + '; charset=utf-8']];
  }),
  ['/kamaitachi-gba-kor/data/kamaitachi.ja.json', [path.join(__dirname, 'kamaitachi-gba-kor/data/kamaitachi.ja.json'), 'application/json; charset=utf-8']],
  // MP2K sound module and the cartridge's sound data (kamaitachi-gba-kor/tools/extract_sound.py)
  ...['index.html', 'm4a.js', 'output.js', 'worklet.js'].map(file => ['/ports/kamaitachi-gba/sound/' + file,
    [path.join(__dirname, 'ports/kamaitachi-gba/sound', file), (file.endsWith('.html') ? 'text/html' : 'text/javascript') + '; charset=utf-8']]),
  ['/kamaitachi-gba-kor/port-data/sound/m4a.json', [path.join(__dirname, 'kamaitachi-gba-kor/port-data/sound/m4a.json'), 'application/json; charset=utf-8']],
  ['/kamaitachi-gba-kor/port-data/sound/m4a.bin', [path.join(__dirname, 'kamaitachi-gba-kor/port-data/sound/m4a.bin'), 'application/octet-stream']],
  // Title-card still: the pension at night (scene picture 002 from kamaitachi-gba-kor).
  ['/art/kamaitachi-still.png', [path.join(__dirname, 'kamaitachi-gba-kor/assets/bg/002.png'), 'image/png']],
  // Title logo: the official clear logo traced to vector paths and laid out on one line (kamaitachi-gba-kor/assets/hub).
  ['/art/kamaitachi-logo.svg', [path.join(__dirname, 'kamaitachi-gba-kor/assets/hub/logo-row.svg'), 'image/svg+xml']],
  // Cover art for the works list: each work's package front, cropped to 3:2 (kamaitachi-gba-kor/assets/hub/covers).
  ...['higanbana', 'otogirisou', 'machi', 'majo', 'yakouchuu', 'yakouchuu2', 'zakuro', 'anubis'].map(slug =>
    ['/art/covers/' + slug + '.jpg', [path.join(__dirname, 'kamaitachi-gba-kor', 'assets', 'hub', 'covers', slug + '.jpg'), 'image/jpeg']]),
  ['/style.css', [path.join(__dirname, 'style.css'), 'text/css; charset=utf-8']],
  ['/games.js', [path.join(__dirname, 'games.js'), 'text/javascript; charset=utf-8']],
  ['/AGB-AHZJ.gba', [path.join(__dirname, '..', 'AGB-AHZJ.gba'), 'application/octet-stream']],
  ['/AGB-AKZJ.gba', [path.join(__dirname, '..', 'AGB-AKZJ.gba'), 'application/octet-stream']]
]);

// The native-bytecode port (ports/kamaitachi-gba) and its extracted cartridge data (port-data).
const portTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.bin': 'application/octet-stream', '.tsv': 'text/tab-separated-values; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.PAC': 'application/octet-stream', '.ch0': 'application/octet-stream', '.pac': 'application/octet-stream' };
// Kamaitachi 2 (PS2) web build lives in the private kamaitachi2-ps2-kor checkout on this PC; its web/ folder path is
// in a local, uncommitted serve.ps2web (one line). Disc images are never among the served types.
const ps1Data = (() => { try { return path.resolve(__dirname, fs.readFileSync(path.join(__dirname, 'serve.ps1data'), 'utf8').trim()); } catch { return path.resolve(__dirname, '..', '..', '_claude-work', 'ps1-web'); } })();
const ps2Web = (() => { try { return path.resolve(__dirname, fs.readFileSync(path.join(__dirname, 'serve.ps2web'), 'utf8').trim()); } catch { return ''; } })();
function portRoute(url) {
  for (const [prefix, dir, exts] of [
    ['/ports/kamaitachi-gba/', path.join(__dirname, 'ports', 'kamaitachi-gba'), ['.html', '.js', '.css']],
    ['/kamaitachi-gba-kor/port-data/', path.join(__dirname, 'kamaitachi-gba-kor', 'port-data'), ['.json', '.bin']],
    ['/kamaitachi-gba-kor/port-data-ko/', path.join(__dirname, 'kamaitachi-gba-kor', 'port-data-ko'), ['.json', '.bin']],
    // SFC port (sound only so far): its page and the cartridge sound data and trace it plays back.
    ['/ports/kamaitachi-sfc/', path.join(__dirname, 'ports', 'kamaitachi-sfc'), ['.html', '.js']],
    ['/kamaitachi-sfc-kor/port-data/', path.join(__dirname, 'kamaitachi-sfc-kor', 'port-data'), ['.bin', '.tsv']],
    // The SFC screen VM (Codex, feat/20): the machine the SFC port's VM page imports; its tests stay out.
    ['/sfc-vm/', path.join(__dirname, 'sfc-vm'), ['.js']],
    // Code shared by every port (save store and sync client); its tests and the reference server stay out.
    ['/shared/', path.join(__dirname, 'shared'), ['.js']],
    // PS1 port: its page, and the private data made on this PC from the user's disc (PACs, exe data, the
    // XA voice channel and converted movies; folder in serve.ps1data, default ../../_claude-work/ps1-web). Open-beta paths
    // since 2026-11-28 (태우: "아이디랑 비밀번호 없이 오픈").
    ['/ports/kamaitachi-ps1/', path.join(__dirname, 'ports', 'kamaitachi-ps1'), ['.html', '.js', '.css']],
    ['/kamaitachi-ps1-kor/port-data/', ps1Data, ['.json', '.bin', '.PAC', '.pac', '.ch0', '.mp4']],
    ['/kamaitachi2-ps2/', ps2Web, ['.html', '.js', '.mjs', '.css', '.json', '.bin', '.png', '.jpg', '.webp', '.svg', '.wasm', '.ogg', '.mp3', '.wav', '.mp4', '.woff2', '.txt']],
  ]) {
    if (!url.startsWith(prefix) || !dir) continue;
    const file = path.join(dir, decodeURIComponent(url.slice(prefix.length)) || 'index.html');
    const ext = path.extname(file);
    if (!file.startsWith(dir + path.sep) || !exts.includes(ext) || /(^|[\\/])(tests?|tools|server)[\\/]/.test(file.slice(dir.length))) return null;
    return [file, portTypes[ext]];
  }
  return null;
}

// Outside testing goes through a tunnel (cloudflared, ngrok): those requests carry a forwarding header.
// They need the test password (env SOUNDNOVEL_PASSWORD or a local, uncommitted serve.password file)
// and never get the cartridge files. Direct requests on this PC are unchanged.
const password = (process.env.SOUNDNOVEL_PASSWORD ?? (() => {
  try { return fs.readFileSync(path.join(__dirname, 'serve.password'), 'utf8'); } catch { return ''; }
})()).trim();
// The SFC VM page reads the cartridge at this address; the file's location on this PC is in a local,
// uncommitted serve.sfcrom (one line, a path). Like the GBA cartridges it is never served through a tunnel.
const SFC_GAME = '/kamaitachi-sfc-kor/port-data/game/kamaitachi.sfc';
const sfcRom = (() => { try { return fs.readFileSync(path.join(__dirname, 'serve.sfcrom'), 'utf8').trim(); } catch { return ''; } })();
if (sfcRom) routes.set(SFC_GAME, [path.resolve(__dirname, sfcRom), 'application/octet-stream']);
const cartridges = new Set(['/AGB-AHZJ.gba', '/AGB-AKZJ.gba', SFC_GAME]);
// Open beta: while a local, uncommitted serve.open file exists (or SOUNDNOVEL_OPEN=1), tunnel visitors
// need no password for the hub, the GBA and PS1 players (and their data and saves). Everything else (PS2 build,
// SFC pages) keeps the password, cartridges stay blocked, and pages ask search engines not to index them.
const openBeta = () => process.env.SOUNDNOVEL_OPEN === '1' || fs.existsSync(path.join(__dirname, 'serve.open'));
const OPEN_PREFIXES = ['/ports/kamaitachi-gba/', '/kamaitachi-gba-kor/', '/ports/kamaitachi-ps1/', '/kamaitachi-ps1-kor/port-data/',
  '/shared/', '/art/', '/play/'];
const openPath = (url) => ['/', '/style.css', '/games.js', '/index.html'].includes(url) || OPEN_PREFIXES.some(prefix => url.startsWith(prefix));
function allowedFromOutside(request, response, url) {
  if (!['cf-connecting-ip', 'x-forwarded-for', 'x-forwarded-host'].some(name => name in request.headers)) return true;
  if (openBeta() && openPath(url)) {
    if (cartridges.has(url)) { response.writeHead(404).end(); return false; }
    response.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return true;
  }
  if (!password) { response.writeHead(503).end('No test password is set on this server.'); return false; }
  const [scheme, token] = (request.headers.authorization ?? '').split(' ');
  const given = scheme === 'Basic' && token ? Buffer.from(token, 'base64').toString().split(':').slice(1).join(':') : '';
  const a = Buffer.from(given), b = Buffer.from(password);
  if (a.length !== b.length || !require('node:crypto').timingSafeEqual(a, b)) {
    response.writeHead(401, {'WWW-Authenticate': 'Basic realm="soundnovel test", charset="UTF-8"'}).end();
    return false;
  }
  if (cartridges.has(url)) { response.writeHead(404).end(); return false; }
  // A page opened with the password leaves this cookie, so the save API (which sends its own
  // Authorization: Bearer) stays behind the same password without a second prompt.
  response.setHeader('Set-Cookie', `sn_gate=${gateCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
  return true;
}
const gateCookie = require('node:crypto').createHash('sha256').update('soundnovel-gate:' + password).digest('hex');
function syncAllowedFromOutside(request, response) {
  if (!['cf-connecting-ip', 'x-forwarded-for', 'x-forwarded-host'].some(name => name in request.headers)) return true;
  if (openBeta()) return true;
  const given = /(?:^|;\s*)sn_gate=([0-9a-f]{64})/.exec(request.headers.cookie ?? '')?.[1] ?? '';
  const a = Buffer.from(given), b = Buffer.from(gateCookie);
  if (password && a.length === b.length && require('node:crypto').timingSafeEqual(a, b)) return true;
  response.writeHead(401, {'Content-Type': 'application/json'}).end('{"error":"open the site with the test password first"}');
  return false;
}

// Save sync (shared/save): /sync/* goes to the save server on 127.0.0.1:SYNC_PORT with /sync stripped.
// Through a tunnel it needs the password cookie that the site sets once the test password is given
// (the save API sends its own Authorization: Bearer, so a Basic prompt can't guard it). Bodies over 256 KB are refused here.
const SYNC_PORT = Number(process.env.SOUNDNOVEL_SYNC_PORT ?? 8780);
const SYNC_MAX_BODY = 256 * 1024;
function proxySync(request, response) {
  const headers = { ...request.headers, host: `127.0.0.1:${SYNC_PORT}` };
  delete headers.cookie;
  if (Number(request.headers['content-length'] ?? 0) > SYNC_MAX_BODY) { response.writeHead(413).end(); request.resume(); return; }
  const upstream = http.request({ host: '127.0.0.1', port: SYNC_PORT, method: request.method,
    path: request.url.slice('/sync'.length) || '/', headers }, (reply) => {
    response.writeHead(reply.statusCode, reply.headers);
    reply.pipe(response);
  });
  upstream.on('error', () => { if (!response.headersSent) response.writeHead(502).end('Save server is not running.'); else response.destroy(); });
  let size = 0;
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > SYNC_MAX_BODY) { upstream.destroy(); if (!response.headersSent) response.writeHead(413).end(); request.destroy(); return; }
    upstream.write(chunk);
  });
  request.on('end', () => upstream.end());
}

const zlib = require('node:zlib');
const gzipCache = new Map(); // file -> {etag, body | pending callbacks}
function gzipped(file, etag, done) {
  const hit = gzipCache.get(file);
  if (hit?.etag === etag) { if (hit.body) return done(hit.body); hit.waiting.push(done); return; }
  const entry = { etag, body: null, waiting: [done] };
  gzipCache.set(file, entry);
  fs.readFile(file, (error, raw) => {
    if (error) { gzipCache.delete(file); entry.waiting.forEach(fn => fn(null)); return; }
    zlib.gzip(raw, { level: 6 }, (failure, body) => {
      if (failure) gzipCache.delete(file); else entry.body = body;
      entry.waiting.forEach(fn => fn(failure ? null : body));
      entry.waiting = [];
    });
  });
}

http.createServer((request, response) => {
  const url = request.url.split('?')[0];
  if (url === '/sync' || url.startsWith('/sync/')) { if (syncAllowedFromOutside(request, response)) proxySync(request, response); return; }
  if (!allowedFromOutside(request, response, url)) return;
  // Dialogue edits (ports/kamaitachi-gba/src/text-editor.js): game data in kamaitachi-gba-kor
  // (port-data/text-edits.json for ja, port-data-ko/text-edits.json for ko), read through the usual
  // /kamaitachi-gba-kor/ path. Writable from this PC and, with the test password, through the tunnel
  // (/edit/ is never an open-beta path, so allowedFromOutside has already asked for it).
  const textEdit = /^\/edit\/text-edits-(ja|ko)\.json$/.exec(url);
  if (textEdit && request.method === 'PUT') {
    const file = path.join(__dirname, 'kamaitachi-gba-kor', textEdit[1] === 'ko' ? 'port-data-ko' : 'port-data', 'text-edits.json');
    const chunks = []; let size = 0, over = false;
    request.on('data', chunk => { size += chunk.length; if (size > 1024 * 1024) { over = true; request.destroy(); } else chunks.push(chunk); });
    request.on('end', () => {
      if (over) return;
      let value;
      try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { value = null; }
      if (!value || typeof value !== 'object' || Array.isArray(value)) { response.writeHead(400).end(); return; }
      const temp = file + '.tmp';
      fs.writeFile(temp, JSON.stringify(value, null, 1) + '\n', (error) => {
        if (error) { response.writeHead(500).end(); return; }
        fs.rename(temp, file, (failure) => response.writeHead(failure ? 500 : 204).end());
      });
    });
    return;
  }
  // scene images from kamaitachi-gba-kor/tools/export_images.py: NNN.png and palette variants NNN-v.png
  const bg = /^\/kamaitachi-gba-kor\/assets\/bg\/(\d{3}(?:-[1-3])?\.png)$/.exec(url);
  const route = bg ? [path.join(__dirname, 'kamaitachi-gba-kor', 'assets', 'bg', bg[1]), 'image/png'] : routes.get(url) ?? portRoute(url);
  if (!route || !['HEAD', 'GET'].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }
  fs.stat(route[0], (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404).end();
      return;
    }
    // Caching: every file carries a validator and is checked on each use, so a returning visitor gets
    // small 304s instead of the whole game again, and code and data never drift apart after a deploy.
    const tag = `${stat.size.toString(36)}-${Math.floor(stat.mtimeMs).toString(36)}`;
    const etag = `W/"${tag}"`;
    response.setHeader('ETag', etag);
    response.setHeader('Last-Modified', stat.mtime.toUTCString());
    response.setHeader('Cache-Control', 'no-cache');
    const given = (request.headers['if-none-match'] ?? '').split(',').map(v => v.trim().replace(/^W\//, ''));
    if (given.includes(`"${tag}"`)) { response.writeHead(304).end(); return; }
    // Compression for text and the larger data files (kept in memory per version, so it is done once).
    const compressible = /^(text\/|application\/(json|octet-stream|javascript)|image\/svg)/.test(route[1]);
    if (compressible && !request.headers.range && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '') && stat.size > 1024 && stat.size < 32 * 1024 * 1024) {
      return gzipped(route[0], etag, (body) => {
        if (!body) { response.writeHead(500).end(); return; }
        response.writeHead(200, {'Content-Type': route[1], 'Content-Encoding': 'gzip', 'Content-Length': body.length, 'Vary': 'Accept-Encoding'});
        response.end(request.method === 'HEAD' ? undefined : body);
      });
    }
    // Byte ranges (video needs them on iPhone Safari): a single "bytes=a-b" range gets a 206.
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? '');
    let start = 0, end = stat.size - 1, status = 200;
    if (range && (range[1] || range[2])) {
      start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
      if (start > end || start >= stat.size) { response.writeHead(416, {'Content-Range': `bytes */${stat.size}`}).end(); return; }
      status = 206;
    }
    response.writeHead(status, {'Content-Type': route[1], 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes',
      ...(status === 206 ? {'Content-Range': `bytes ${start}-${end}/${stat.size}`} : {})});
    if (request.method === 'HEAD') return response.end();
    const stream = fs.createReadStream(route[0], { start, end });
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
}).listen(8770, '127.0.0.1', () => console.log('http://127.0.0.1:8770/'));
