// Pure browser-native standard ZIP writer (PKZIP 2.0 Store format)
// Produces 100% valid .zip files compatible with Windows, macOS, Linux, and GitHub

function computeCrc32(bytes: Uint8Array): number {
  let crc = ~0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (~crc >>> 0);
}

export function createZipArchive(files: { path: string; content: string }[]): Blob {
  const encoder = new TextEncoder();
  const fileRecords: {
    pathBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  const localChunks: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const pathBytes = encoder.encode(file.path);
    const dataBytes = encoder.encode(file.content);
    const crc = computeCrc32(dataBytes);

    const localHeader = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true);       // Local file header signature (PK\x03\x04)
    view.setUint16(4, 20, true);               // Version needed (2.0)
    view.setUint16(6, 0x0800, true);           // General purpose bit flag (UTF-8 encoding)
    view.setUint16(8, 0, true);                // Compression method (0 = uncompressed store)
    view.setUint16(10, 0x4421, true);          // Last mod time
    view.setUint16(12, 0x5821, true);          // Last mod date
    view.setUint32(14, crc, true);             // CRC-32
    view.setUint32(18, dataBytes.length, true);// Compressed size
    view.setUint32(22, dataBytes.length, true);// Uncompressed size
    view.setUint16(26, pathBytes.length, true);// File name length
    view.setUint16(28, 0, true);               // Extra field length
    localHeader.set(pathBytes, 30);

    fileRecords.push({
      pathBytes,
      dataBytes,
      crc,
      offset: currentOffset
    });

    localChunks.push(localHeader);
    localChunks.push(dataBytes);
    currentOffset += localHeader.length + dataBytes.length;
  }

  const centralOffset = currentOffset;
  const centralChunks: Uint8Array[] = [];
  let centralDirectorySize = 0;

  for (const record of fileRecords) {
    const cdHeader = new Uint8Array(46 + record.pathBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true);       // Central directory file header signature (PK\x01\x02)
    view.setUint16(4, 20, true);               // Version made by (2.0)
    view.setUint16(6, 20, true);               // Version needed (2.0)
    view.setUint16(8, 0x0800, true);           // General purpose bit flag (UTF-8)
    view.setUint16(10, 0, true);               // Compression method (0 = store)
    view.setUint16(12, 0x4421, true);          // Last mod time
    view.setUint14 ? view.setUint16(14, 0x5821, true) : view.setUint16(14, 0x5821, true);
    view.setUint32(16, record.crc, true);      // CRC-32
    view.setUint32(20, record.dataBytes.length, true); // Compressed size
    view.setUint32(24, record.dataBytes.length, true); // Uncompressed size
    view.setUint16(28, record.pathBytes.length, true); // File name length
    view.setUint16(30, 0, true);               // Extra field length
    view.setUint16(32, 0, true);               // File comment length
    view.setUint16(34, 0, true);               // Disk number start
    view.setUint16(36, 0, true);               // Internal file attributes
    view.setUint32(38, 0, true);               // External file attributes
    view.setUint32(42, record.offset, true);   // Relative offset of local header
    cdHeader.set(record.pathBytes, 46);

    centralChunks.push(cdHeader);
    centralDirectorySize += cdHeader.length;
  }

  // End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);     // End of central dir signature (PK\x05\x06)
  eocdView.setUint16(4, 0, true);              // Number of this disk
  eocdView.setUint16(6, 0, true);              // Disk where central directory starts
  eocdView.setUint16(8, fileRecords.length, true);  // Number of central dir records on this disk
  eocdView.setUint16(10, fileRecords.length, true); // Total number of central dir records
  eocdView.setUint32(12, centralDirectorySize, true);// Size of central directory
  eocdView.setUint32(16, centralOffset, true);      // Offset of start of central directory
  eocdView.setUint16(20, 0, true);             // Comment length

  return new Blob([...localChunks, ...centralChunks, eocd], { type: 'application/zip' });
}
