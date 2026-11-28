const CARD_SIZE = 128 * 1024;
const BLOCK_SIZE = 8 * 1024;
const PRODUCT = 'BISLPS-01863';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function checksum(bytes, end) {
  let value = 0;
  for (let index = 0; index < end; index++) value ^= bytes[index];
  return value;
}

export class VirtualMemoryCard {
  constructor(raw = null) {
    this.raw = raw ? Uint8Array.from(raw) : new Uint8Array(CARD_SIZE).fill(0xff);
    if (this.raw.length !== CARD_SIZE) throw new RangeError('A PS1 memory card is 128 KiB');
    if (!raw) {
      this.raw[0] = 0x4d; this.raw[1] = 0x43;
      this.raw[127] = checksum(this.raw, 127);
    }
  }

  isEmpty() {
    return this.raw.subarray(BLOCK_SIZE).every(value => value === 0xff);
  }

  save(state) {
    const payload = encoder.encode(JSON.stringify(state));
    const header = encoder.encode(`${PRODUCT}\0`);
    if (header.length + 4 + payload.length > BLOCK_SIZE) throw new RangeError('Save state exceeds one card block');
    const block = this.raw.subarray(BLOCK_SIZE, 2 * BLOCK_SIZE);
    block.fill(0);
    block.set(header);
    new DataView(block.buffer, block.byteOffset).setUint32(header.length, payload.length, true);
    block.set(payload, header.length + 4);
    return this.export();
  }

  load() {
    const block = this.raw.subarray(BLOCK_SIZE, 2 * BLOCK_SIZE);
    const header = encoder.encode(`${PRODUCT}\0`);
    if (!header.every((value, index) => block[index] === value)) return null;
    const length = new DataView(block.buffer, block.byteOffset).getUint32(header.length, true);
    if (length > BLOCK_SIZE - header.length - 4) throw new RangeError('Corrupt memory-card save length');
    return JSON.parse(decoder.decode(block.subarray(header.length + 4, header.length + 4 + length)));
  }

  export() { return this.raw.slice(); }
}

export {CARD_SIZE, PRODUCT};
