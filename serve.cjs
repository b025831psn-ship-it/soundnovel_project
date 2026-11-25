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
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.bin': 'application/octet-stream', '.tsv': 'text/tab-separated-values; charset=utf-8' };
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
  ]) {
    if (!url.startsWith(prefix)) continue;
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
const OUTPAINT = path.join(__dirname, 'kamaitachi-gba-kor', 'assets', 'outpaint', 'portrait');
const cartridges = new Set(['/AGB-AHZJ.gba', '/AGB-AKZJ.gba', SFC_GAME]);
function allowedFromOutside(request, response, url) {
  if (!['cf-connecting-ip', 'x-forwarded-for', 'x-forwarded-host'].some(name => name in request.headers)) return true;
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

http.createServer((request, response) => {
  const url = request.url.split('?')[0];
  if (url === '/sync' || url.startsWith('/sync/')) { if (syncAllowedFromOutside(request, response)) proxySync(request, response); return; }
  if (!allowedFromOutside(request, response, url)) return;
  // scene images from kamaitachi-gba-kor/tools/export_images.py: NNN.png and palette variants NNN-v.png
  // Pictures extended for upright phones (kamaitachi-gba-kor assets/outpaint/portrait/NNN.png) and their list.
  if (url === '/art/outpaint/index.json') {
    let ids = [];
    try { ids = fs.readdirSync(OUTPAINT).filter(f => /^\d{3}\.png$/.test(f)).map(f => Number(f.slice(0, 3))); } catch {}
    response.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify(ids));
    return;
  }
  const extended = /^\/art\/outpaint\/(\d{3}\.png)$/.exec(url);
  if (extended) routes.set(url, [path.join(OUTPAINT, extended[1]), 'image/png']);
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
    response.writeHead(200, {'Content-Type': route[1], 'Content-Length': stat.size});
    if (request.method === 'HEAD') return response.end();
    const stream = fs.createReadStream(route[0]);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
}).listen(8770, '127.0.0.1', () => console.log('http://127.0.0.1:8770/'));
