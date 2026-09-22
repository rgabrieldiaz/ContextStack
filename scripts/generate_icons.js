const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Tabla de CRC32 para la especificación PNG
 */
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crcBuf]);
}

/**
 * Genera un archivo PNG RGBA básico con un diseño en gradiente elegante (Slate 900 -> Indigo 600)
 */
function generateIconPNG(size) {
  const width = size;
  const height = size;

  // Firma PNG
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // Cabecera IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits por canal
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Datos de píxeles (RGBA por cada línea de escaneo, precedidos por 0 para filtro nulo)
  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0; // Filtro 0 para cada fila

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normDist = dist / maxR;

      // Fondo oscuro con esquinas redondeadas
      const cornerRadius = size * 0.22;
      const inBox = (x >= 1 && x < width - 1 && y >= 1 && y < height - 1);

      // Icono central (rayo/volt)
      const isLightning = (
        (dx * 0.8 + dy * 0.5 < size * 0.15 && dx * -0.5 + dy * 0.8 > -size * 0.25 && dy < size * 0.25) ||
        (dx * -0.8 - dy * 0.5 < size * 0.15 && dx * 0.5 - dy * 0.8 > -size * 0.25 && dy > -size * 0.25)
      );

      let r, g, b, a;

      if (isLightning) {
        // Rayo en violeta/indigo brillante con gradiente
        r = Math.min(255, Math.floor(99 + normDist * 100));
        g = Math.min(255, Math.floor(102 + (1 - normDist) * 120));
        b = 241;
        a = 255;
      } else {
        // Fondo Slate 900 -> Slate 800
        r = Math.floor(15 + (x / width) * 20);
        g = Math.floor(23 + (y / height) * 25);
        b = Math.floor(42 + (x / width) * 35);
        a = 255;
      }

      rawScanlines[offset++] = r;
      rawScanlines[offset++] = g;
      rawScanlines[offset++] = b;
      rawScanlines[offset++] = a;
    }
  }

  // Compresión Zlib para IDAT
  const compressedData = zlib.deflateSync(rawScanlines);
  const idatChunk = createChunk('IDAT', compressedData);

  // Fin IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuffer = generateIconPNG(size);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`✓ Generado: ${filePath} (${pngBuffer.length} bytes)`);
});
