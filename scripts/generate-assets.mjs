// Deterministic local asset generation. Node standard library only.
// Generates public/og-image.png: palette + grid texture + "N" glyph, no text rasterization,
// no network, no randomness, no timestamps.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200;
const H = 630;

const INK = [23, 35, 31];
const GRID = [38, 54, 48];
const SURFACE = [244, 247, 242];
const SIGNAL = [228, 91, 79];
const YELLOW = [230, 200, 92];

const CELL = 60;
const stride = W * 3;
const raw = Buffer.alloc((stride + 1) * H);

function set(x, y, [r, g, b]) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = y * (stride + 1) + 1 + x * 3;
  raw[i] = r;
  raw[i + 1] = g;
  raw[i + 2] = b;
}

// Base fill with a subtle technical grid.
for (let y = 0; y < H; y++) {
  raw[y * (stride + 1)] = 0; // PNG filter type 0
  const onRow = y % CELL === 0;
  for (let x = 0; x < W; x++) {
    const onGrid = onRow || x % CELL === 0;
    set(x, y, onGrid ? GRID : INK);
  }
}

// "N" glyph: two bars + diagonal, echoing the text wordmark treatment.
const top = 165;
const bottom = 465;
const thick = 44;
const leftX = 120;
const rightX = 372;

for (let y = top; y <= bottom; y++) {
  for (let x = leftX; x < leftX + thick; x++) set(x, y, SURFACE);
  for (let x = rightX; x < rightX + thick; x++) set(x, y, SURFACE);
  const t = (y - top) / (bottom - top);
  const cx = leftX + thick + t * (rightX - (leftX + thick));
  const half = thick / 2;
  for (let x = Math.floor(cx - half); x < cx + half; x++) set(x, y, SIGNAL);
}

// Underline tick aligned with the glyph.
const tickY = bottom + 40;
const tickH = 10;
for (let y = tickY; y < tickY + tickH; y++) {
  for (let x = leftX; x <= rightX + thick; x++) set(x, y, YELLOW);
}

// --- Minimal PNG encoder (RGB, 8-bit, filter 0) ---
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
function encodePng(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = join(root, 'public');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'og-image.png');
const png = encodePng(W, H, raw);
writeFileSync(outPath, png);
console.log(`generated ${outPath} (${png.length} bytes)`);

// A quiet, full-bleed technical grid for the hero background.
const textureWidth = 240;
const textureHeight = 240;
const textureStride = textureWidth * 3;
const textureRaw = Buffer.alloc((textureStride + 1) * textureHeight);
const textureSurface = [244, 247, 242];
const textureLine = [229, 235, 230];

for (let y = 0; y < textureHeight; y++) {
  textureRaw[y * (textureStride + 1)] = 0;
  for (let x = 0; x < textureWidth; x++) {
    const color = x % 48 === 0 || y % 48 === 0 ? textureLine : textureSurface;
    const offset = y * (textureStride + 1) + 1 + x * 3;
    textureRaw[offset] = color[0];
    textureRaw[offset + 1] = color[1];
    textureRaw[offset + 2] = color[2];
  }
}

const texturePath = join(outDir, 'hero-grid.png');
const texturePng = encodePng(textureWidth, textureHeight, textureRaw);
writeFileSync(texturePath, texturePng);
console.log(`generated ${texturePath} (${texturePng.length} bytes)`);
