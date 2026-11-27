// 移動 (0800D9A0): the flowchart of scenes seen so far, from the in-game menu (R).
//
// The map (LZ77 at 08FC002C, kgk ui/flow-map.bin) is a grid of 7 x 24 pages. Each page holds up
// to 6 x 6 positions; the cursor moves over positions (0..0x29, 0..0x8F) and the screen shows the
// page under it. Everything is drawn on the OBJ text surface: links (0800D2FC, 0800D624), scene
// boxes (0800D7F8), the page map at the right and R:スクロール (08006A10). The cursor is four
// semi-transparent 32x16 OBJs around the box (08001960) and the page marker one 4x4 OBJ (08001794).
//
// A on a scene seen before restores the flowchart state of the last scene start, forgets what was
// seen after it (0800CFCC keeps bit 0) and starts the scenario at that scene: bank 0x27, row
// node - 1 (08003600), which begins with 1D 67.

const COLUMNS = 7;
const ROWS = 24;
const GLYPH = 0x2a; // 6 x 7 bytes
const R_SCROLL = 17; // index of R:スクロール in ui/map-glyphs.bin (after 0-9, A-F, N)
const SPECIAL_TITLES = { 0xc8: 0, 0x61: 1, 3: 2, 0xc5: 3 }; // 0801ABB4, ABD4, ABF4, AC18
const MARKERS = [0x41, 0x42, 0x43, 0x44];
// 0800D09C: how many choice letters a box shows for its kind (0800D178 jump table).
const MARKER_COUNT = [0, 0, 2, 3, 4, 4, 0, 2, 3, 4, 4];
// 08006910: glyph byte 0x0E takes this table at the foreground index (080197EF).
const FOREGROUND = [0x02, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0a, 0x0b, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x04, 0x02];

const scaleX = (x) => Math.trunc((x * 3 * 64) / 256);
const scaleY = (y) => Math.trunc((y * 14) / 20);

export class FlowMap {
  constructor({ flow, glyphs, titles }) {
    this.flow = flow;
    this.glyphs = glyphs;
    this.titles = titles;
    const be = (at) => ((flow[at] << 24) | (flow[at + 1] << 16) | (flow[at + 2] << 8) | flow[at + 3]) >>> 0;
    // 0800D954 / 08009B80: three sections; the first two are tables of 168 LE offsets.
    this.nodes = be(4);
    this.links = be(4 + 8);
    this.titleList = be(4 + 8 * 2);
  }

  half(at) {
    return this.flow[at] | (this.flow[at + 1] << 8);
  }

  // 0800CF04..0800CF1C: a node entry is 3 bytes: kind (6 bits) and id (10 bits), then x, y.
  *entries(cell) {
    const offset = this.half(this.nodes + 2 * cell);
    if (!offset) return;
    for (let at = this.nodes + offset; this.flow[at] || this.flow[at + 1]; at += 3) {
      const b0 = this.flow[at];
      yield { kind: b0 & 0x3f, id: (b0 >> 6) | (this.flow[at + 1] << 2), x: this.flow[at + 2] >> 4, y: this.flow[at + 2] & 15 };
    }
  }

  // A link group: ids (bit 15 marks the last), then points until 0xFF.
  *groups(cell) {
    const offset = this.half(this.links + 2 * cell);
    if (!offset) return;
    let at = this.links + offset;
    while (this.flow[at] || this.flow[at + 1]) {
      const ids = [];
      let word;
      do {
        word = this.half(at);
        ids.push(word);
        at += 2;
      } while (!(word & 0x8000));
      const points = [];
      while (this.flow[at] !== 0xff) points.push(this.flow[at++]);
      at++;
      yield { ids, points };
    }
  }

  // 0800CF38: a node's state on the map (02002A68; node 0x7E never shows).
  nodeState(ram, id) {
    return id === 0x7e ? 0 : ram.seenNodes[id];
  }

  // 0800D2B4: a choice box whose branch is still locked shows as a thin bar.
  locked(ram, kind, id) {
    let flag = 0x34;
    if (id - 2 <= 1 || id === 6 || id === 0x11 || id === 0x15 || id === 0x19) flag = 0x33;
    else if (id === 0xcd) flag = 0x35;
    return !ram.flags[flag] && kind > 6 && kind <= 10; // 020024EC
  }

  // 0800D9C6: each page's mark on the page map: 7 if it holds something seen this play, 6 if
  // only something seen in an earlier play. Also finds the cursor (the current node).
  survey(ram) {
    const pages = new Uint8Array(COLUMNS * ROWS);
    let cursor = null;
    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        const cell = row * COLUMNS + column;
        let nodes = 0;
        let links = 0;
        for (const entry of this.entries(cell)) {
          if (entry.id === ram.node) cursor = { x: column * 6 + entry.x, y: row * 6 + entry.y };
          const state = this.nodeState(ram, entry.id);
          if (state === 3) nodes = 7;
          else if (state && nodes !== 7) nodes = 6;
        }
        for (const { ids } of this.groups(cell)) {
          for (const word of ids) {
            const state = ram.seenEdges[word & 0x7fff];
            if (state === 3) links = 7;
            else if (state && links !== 7) links = 6;
          }
        }
        pages[cell] = Math.max(nodes, links);
      }
    }
    return { pages, cursor: cursor ?? { x: 0, y: 0 } };
  }

  // 08006938: one 6x7 glyph; 0 is the background color, 0x0E the foreground, others as they are.
  glyph(surface, index, x, y, foreground, background) {
    const base = index * GLYPH;
    for (let py = 0; py < 7; py++) {
      for (let px = 0; px < 6; px++) {
        const value = this.glyphs[base + py * 6 + px];
        const color = value === 0x0e ? FOREGROUND[foreground] : value === 0 ? background : value;
        surface.put(x + px, y + py, color);
      }
    }
  }

  // 080069B4: digits, A-F and N.
  character(surface, code, x, y, foreground, background) {
    let index = -1;
    if (code >= 0x30 && code <= 0x39) index = code - 0x30;
    else if (code >= 0x41 && code <= 0x46) index = 10 + code - 0x41;
    else if (code === 0x4e) index = 16;
    if (index >= 0) this.glyph(surface, index, x, y, foreground, background);
  }

  // 0800D7F8 for one page.
  drawNodes(surface, ram, cell) {
    let color = 0;
    for (const { kind, id, x, y } of this.entries(cell)) {
      const state = this.nodeState(ram, id);
      if (!state) continue;
      if (kind === 0) color = 0x0d;
      if (kind >= 2 && kind <= 5) color = 4;
      if (kind === 6) color = 0x0e;
      if (kind >= 7 && kind <= 10) color = 4;
      if (kind > 10) color = 0x0c;
      if (this.locked(ram, kind, id)) {
        const bar = state === 3 ? 4 : state === 1 ? 3 : 0;
        surface.fill(scaleX(x * 36 + 0x1b), y * 28 + 0x2f, 1, 0x14, bar);
        continue;
      }
      const left = scaleX(x * 36 + 12);
      const top = y * 28 + 0x2f;
      surface.fill(left, top, 0x16, 0x0a, color);
      surface.fill(left, y * 28 + 0x39, 0x16, 0x0a, 3);
      this.label(surface, ram, left, scaleY(top), kind, id, color);
    }
  }

  // 0800D09C: the scene number on the box, then its choice letters (gray once tried, pink when
  // every branch under it was seen; 02002F94) or END and the ending number.
  label(surface, ram, x, y, kind, id, color) {
    const tried = ram.tried?.[id] ?? 0;
    const marks = [0, 2, 4, 6].map((shift) => {
      const value = (tried >> shift) & 3;
      return value === 3 ? 2 : value === 1 ? 0 : 1;
    });
    if (id === 5 && !(ram.endings & 1)) kind--;
    if (id === 0x16 && !(ram.endings & 2)) kind--;
    const digits = String(id).padStart(3, "0");
    // 0800CF58: hundreds only from 100, tens only from 10.
    if (id > 99) this.character(surface, digits.charCodeAt(0), x + 2, y, 8, color);
    if (id > 9) this.character(surface, digits.charCodeAt(1), x + 8, y, 8, color);
    this.character(surface, digits.charCodeAt(2), x + 14, y, 8, color);
    y += 8;
    if (kind > 10) {
      const ending = kind - 10;
      this.character(surface, 0x45, x - 2, y, 8, 3);
      this.character(surface, 0x4e, x + 3, y, 8, 3);
      this.character(surface, 0x44, x + 8, y, 8, 3);
      this.character(surface, 0x30 + Math.trunc(ending / 10), x + 13, y, 8, 3);
      this.character(surface, 0x30 + (ending % 10), x + 18, y, 8, 3);
      return;
    }
    const offsets = [1, 6, 11, 16];
    for (let i = 0; i < MARKER_COUNT[kind]; i++)
      this.character(surface, MARKERS[i], x + offsets[i], y, 8 + marks[i], 3);
  }

  // 0800D2FC: the link lines of one page, earlier plays (gray, 3) first, then this play (pink, 4).
  drawLinks(surface, ram, cell, page) {
    for (let pass = 0; pass < 2; pass++) {
      for (const { ids, points } of this.groups(cell)) {
        let color = 0;
        for (const word of ids) {
          const state = ram.seenEdges[word & 0x7fff];
          if (pass === 0 && state === 1) color = 3;
          if (pass === 1 && state === 3) color = 4;
        }
        const show = color !== 0 && (color === 3 ? pass === 0 : pass !== 0);
        const last = ids[ids.length - 1];
        let px = points[0] >> 5;
        let py = (points[0] >> 2) & 7;
        let type = points[0] & 3;
        let x = px * 36 - 9;
        let y = py * 28 + 0x2a;
        if (x <= 0x15) x = 6;
        else if (x > 0xd4) x = 0xe2;
        if (show) {
          if (type === 1) surface.corners(scaleX(x), y - 3, scaleX(x + 2), y + 2, color);
          if (type === 2) surface.corners(scaleX(x), y, scaleX(x + 2), y + 5, color);
        }
        for (const point of points.slice(1)) {
          const qx = point >> 5;
          const qy = (point >> 2) & 7;
          const previous = type;
          type = point & 3;
          let x0 = px * 36 - 9;
          let y0 = py * 28 + 0x2a;
          let x1 = qx * 36 - 9;
          let y1 = qy * 28 + 0x2a;
          let capped = false;
          if (show) {
            if (type === 1) surface.corners(scaleX(x1), y1 - 3, scaleX(x1 + 2), y1 + 2, color);
            if (type === 2) {
              surface.corners(scaleX(x1), y1, scaleX(x1 + 2), y1 + 7, color);
              capped = true;
            }
          }
          if (x0 <= 0x15) x0 = 6;
          if (x1 <= 0x17) x1 = 6;
          if (x0 > x1) [x0, x1] = [x1, x0];
          if (y0 > y1) [y0, y1] = [y1, y0];
          const joined = previous === type && (type === 1 || type === 2);
          if (!joined && show) {
            if (scaleY(y1 - (y0 - 2)) > 2 && !capped && !(page.column === 0 && page.row === 0x11) && last !== 0x812a)
              y1--;
            surface.corners(scaleX(x0), y0, scaleX(x1 + 2), y1 + 2, color);
          }
          px = qx;
          py = qy;
        }
      }
    }
  }

  // 0800D624: where links cross, a dash with a gap on both sides (points of type 3).
  drawCrossings(surface, ram, cell) {
    for (const { ids, points } of this.groups(cell)) {
      let color = 0;
      for (const word of ids) {
        const state = ram.seenEdges[word & 0x7fff];
        if (state === 1) color = 3;
        if (state === 3) color = 4;
      }
      points.forEach((point, index) => {
        if (!color || (point & 3) !== 3) return;
        const x = (point >> 5) * 36;
        const row = ((point >> 2) & 7) * 28;
        surface.corners(scaleX(x - 11), row + 0x2a, scaleX(x - 5), row + 0x2c, 0);
        let top = row + 0x29;
        if (index > 0 && scaleY(row + 0x2a) === scaleY(top)) top--;
        surface.corners(scaleX(x - 13), top, scaleX(x - 3), top + 2, color);
      });
    }
  }

  // 0800D9A0's page draw: clear the map area, links, crossings and boxes.
  drawPage(surface, ram, page) {
    surface.fill(4, 0x27, 0xb3, 0xc0, 0);
    const cell = page.row * COLUMNS + page.column;
    this.drawLinks(surface, ram, cell, page);
    this.drawCrossings(surface, ram, cell);
    this.drawNodes(surface, ram, cell);
  }

  // 08006A10 and the page map (0800DD04): only when 移動 opens.
  drawPageMap(surface, pages) {
    for (let i = 0; i < 7; i++) this.glyph(surface, R_SCROLL + i, 0xc2 + 6 * i, 0x1c, 8, 0);
    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        let color = pages[row * COLUMNS + column];
        if (color === 6) color = 0x0f;
        else if (color === 7) color = 6;
        surface.rect(0xc8 + 5 * column, 0x26 + 5 * row, 4, 4, color);
      }
    }
  }

  // The scene under the cursor (0800DD84): a box (not a locked bar) at that exact position.
  sceneAt(ram, cursor) {
    const cell = Math.trunc(cursor.y / 6) * COLUMNS + Math.trunc(cursor.x / 6);
    let found = null;
    for (const entry of this.entries(cell)) {
      if (!this.nodeState(ram, entry.id) || this.locked(ram, entry.kind, entry.id)) continue;
      if (entry.x === cursor.x % 6 && entry.y === cursor.y % 6) found = entry;
    }
    return found;
  }

  // 0800DECC: the header title; 's8' pairs are dropped and two characters swapped for others.
  title(id) {
    if (id in SPECIAL_TITLES) {
      let at = 0;
      for (let n = SPECIAL_TITLES[id]; n > 0; n--) at = this.titles.indexOf(0, at) + 1;
      return this.titles.slice(at, this.titles.indexOf(0, at));
    }
    const flow = this.flow;
    const be = (at) => ((flow[at] << 24) | (flow[at + 1] << 16) | (flow[at + 2] << 8) | flow[at + 3]) >>> 0;
    const list = this.titleList;
    let at = list + be(list + 4 * (id - 1));
    const out = [];
    for (; flow[at]; at += 2) {
      if (flow[at] === 0x73 || flow[at + 1] === 0x38) continue;
      let low = flow[at + 1];
      if (flow[at] === 0x8a && low === 0x99) low = 0x98;
      if (flow[at] === 0x81 && low === 0x90) low = 0x94;
      out.push(flow[at], low);
    }
    return Uint8Array.from(out);
  }
}

// The OBJ text surface as palette 15 indices (0 = transparent), with 080008F4 / 08006AA0 fills.
export class MapSurface {
  constructor(pixels = new Uint8Array(240 * 160)) {
    this.pixels = pixels;
  }

  put(x, y, color) {
    if (x < 0 || x >= 240 || y < 0 || y >= 160) return;
    this.pixels[y * 240 + x] = color;
  }

  // 080008F4: a rectangle in screen pixels.
  rect(x, y, w, h, color) {
    for (let py = Math.max(0, y); py < Math.min(160, y + h); py++)
      for (let px = Math.max(0, x); px < Math.min(240, x + w); px++) this.pixels[py * 240 + px] = color;
  }

  // 08006AA0: y and height in text units (x 14/20).
  fill(x, y, w, h, color) {
    this.rect(x, scaleY(y), w, scaleY(h), color);
  }

  // 08006B58: by corners.
  corners(x0, y0, x1, y1, color) {
    this.fill(x0, y0, x1 - x0, y1 - y0, color);
  }
}

export const FLOW_COLUMNS = COLUMNS;
export const FLOW_ROWS = ROWS;
export { scaleX as flowScaleX };
