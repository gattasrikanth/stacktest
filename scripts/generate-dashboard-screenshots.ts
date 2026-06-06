const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.resolve(process.cwd(), "website/static/img/dashboard");
const WIDTH = 1440;
const HEIGHT = 1000;

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function rgba(hex, alpha = 255) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    alpha,
  ];
}

function rect(pixels, x, y, w, h, color) {
  const [r, g, b, a] = color;
  for (let row = Math.max(0, y); row < Math.min(HEIGHT, y + h); row++) {
    for (let col = Math.max(0, x); col < Math.min(WIDTH, x + w); col++) {
      const idx = (row * WIDTH + col) * 4;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }
}

function makePng(name, accent, failed = false) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);
  rect(pixels, 0, 0, WIDTH, HEIGHT, rgba("#0b1020"));
  rect(pixels, 0, 0, 240, HEIGHT, rgba("#080d1a"));
  rect(pixels, 32, 40, 48, 48, rgba(accent));
  rect(pixels, 280, 56, 520, 72, rgba("#eef2ff"));
  rect(pixels, 280, 150, 240, 96, rgba("#121a2e"));
  rect(pixels, 540, 150, 240, 96, rgba("#121a2e"));
  rect(pixels, 800, 150, 240, 96, rgba("#121a2e"));

  for (let i = 0; i < 5; i++) {
    rect(pixels, 280, 290 + i * 104, 1040, 78, rgba("#121a2e"));
    rect(pixels, 300, 310 + i * 104, 260, 18, rgba("#dbeafe"));
    rect(pixels, 300, 340 + i * 104, 180, 12, rgba("#64748b"));
    rect(pixels, 1130, 315 + i * 104, 110, 28, rgba(i === 1 && failed ? "#fb7185" : accent));
  }

  if (name.includes("detail") || name.includes("live")) {
    rect(pixels, 280, 290, 450, 520, rgba("#121a2e"));
    rect(pixels, 760, 290, 560, 520, rgba("#121a2e"));
    for (let i = 0; i < 7; i++) {
      rect(pixels, 800, 330 + i * 58, 4, 42, rgba(i === 3 && failed ? "#fb7185" : accent));
      rect(pixels, 830, 330 + i * 58, 230, 14, rgba("#dbeafe"));
      rect(pixels, 830, 354 + i * 58, 360, 10, rgba("#64748b"));
    }
  }

  if (name.includes("artifacts")) {
    rect(pixels, 280, 290, 320, 560, rgba("#121a2e"));
    rect(pixels, 630, 290, 690, 560, rgba("#070b15"));
    for (let i = 0; i < 10; i++) {
      rect(pixels, 310, 330 + i * 42, 170, 12, rgba(i % 3 === 0 ? "#fbbf24" : "#dbeafe"));
      rect(pixels, 670, 330 + i * 42, 470, 10, rgba("#64748b"));
    }
  }

  const rawRows = [];
  for (let row = 0; row < HEIGHT; row++) {
    rawRows.push(Buffer.from([0]));
    rawRows.push(pixels.subarray(row * WIDTH * 4, (row + 1) * WIDTH * 4));
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(rawRows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(path.join(OUT_DIR, name), png);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
makePng("dashboard-run-history.png", "#60a5fa");
makePng("dashboard-run-detail-passed.png", "#36d399");
makePng("dashboard-run-detail-failed.png", "#fb7185", true);
makePng("dashboard-live-run.png", "#60a5fa");
makePng("dashboard-artifacts.png", "#fbbf24");
console.log(`Generated dashboard screenshots in ${OUT_DIR}`);
