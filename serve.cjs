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
  // Cover art for the works list: original drawings, one per work (art/covers).
  ...['higanbana', 'otogirisou', 'machi', 'majo', 'yakouchuu', 'yakouchuu2', 'zakuro', 'anubis'].map(slug =>
    ['/art/covers/' + slug + '.svg', [path.join(__dirname, 'art', 'covers', slug + '.svg'), 'image/svg+xml']]),
  ['/style.css', [path.join(__dirname, 'style.css'), 'text/css; charset=utf-8']],
  ['/games.js', [path.join(__dirname, 'games.js'), 'text/javascript; charset=utf-8']],
  ['/AGB-AHZJ.gba', [path.join(__dirname, '..', 'AGB-AHZJ.gba'), 'application/octet-stream']],
  ['/AGB-AKZJ.gba', [path.join(__dirname, '..', 'AGB-AKZJ.gba'), 'application/octet-stream']]
]);

// The native-bytecode port (ports/kamaitachi-gba) and its extracted cartridge data (port-data).
const portTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.bin': 'application/octet-stream' };
function portRoute(url) {
  for (const [prefix, dir, exts] of [
    ['/ports/kamaitachi-gba/', path.join(__dirname, 'ports', 'kamaitachi-gba'), ['.html', '.js', '.css']],
    ['/kamaitachi-gba-kor/port-data/', path.join(__dirname, 'kamaitachi-gba-kor', 'port-data'), ['.json', '.bin']],
  ]) {
    if (!url.startsWith(prefix)) continue;
    const file = path.join(dir, decodeURIComponent(url.slice(prefix.length)) || 'index.html');
    const ext = path.extname(file);
    if (!file.startsWith(dir + path.sep) || !exts.includes(ext) || /(^|[\\/])(tests?|tools)[\\/]/.test(file.slice(dir.length))) return null;
    return [file, portTypes[ext]];
  }
  return null;
}

http.createServer((request, response) => {
  const url = request.url.split('?')[0];
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
    response.writeHead(200, {'Content-Type': route[1], 'Content-Length': stat.size});
    if (request.method === 'HEAD') return response.end();
    const stream = fs.createReadStream(route[0]);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
}).listen(8770, '127.0.0.1', () => console.log('http://127.0.0.1:8770/'));
