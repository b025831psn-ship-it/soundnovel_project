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
  ['/style.css', [path.join(__dirname, 'style.css'), 'text/css; charset=utf-8']],
  ['/games.js', [path.join(__dirname, 'games.js'), 'text/javascript; charset=utf-8']],
  ['/AGB-AHZJ.gba', [path.join(__dirname, '..', 'AGB-AHZJ.gba'), 'application/octet-stream']],
  ['/AGB-AKZJ.gba', [path.join(__dirname, '..', 'AGB-AKZJ.gba'), 'application/octet-stream']]
]);

http.createServer((request, response) => {
  const url = request.url.split('?')[0];
  // scene images from kamaitachi-gba-kor/tools/export_images.py: NNN.png and palette variants NNN-v.png
  const bg = /^\/kamaitachi-gba-kor\/assets\/bg\/(\d{3}(?:-[1-3])?\.png)$/.exec(url);
  const route = bg ? [path.join(__dirname, 'kamaitachi-gba-kor', 'assets', 'bg', bg[1]), 'image/png'] : routes.get(url);
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
