import type { IservArchiveTextFile } from '@viccoboard/students';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_FILE_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;
const MAX_ARCHIVE_ENTRIES = 2000;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;

interface ZipEntry {
  path: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

export async function readIservZipFile(file: File): Promise<IservArchiveTextFile[]> {
  if (!file.name.toLocaleLowerCase('de-DE').endsWith('.zip')) {
    throw new Error('Bitte eine ZIP-Datei aus IServ auswählen.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = parseCentralDirectory(bytes)
    .filter((entry) => entry.path.toLocaleLowerCase('de-DE').endsWith('.csv'));

  if (entries.length === 0) {
    throw new Error('Das ZIP-Archiv enthält keine CSV-Dateien.');
  }

  const totalSize = entries.reduce((sum, entry) => sum + entry.uncompressedSize, 0);
  if (totalSize > MAX_TOTAL_UNCOMPRESSED_BYTES) {
    throw new Error('Das ZIP-Archiv ist für den lokalen Import zu groß.');
  }

  const files: IservArchiveTextFile[] = [];
  for (const entry of entries) {
    const contentBytes = await extractEntry(bytes, entry);
    files.push({
      path: entry.path,
      content: decodeCsvText(contentBytes)
    });
  }

  return files;
}

function parseCentralDirectory(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(view);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);

  if (entryCount === 0xffff || centralDirectoryOffset === 0xffffffff) {
    throw new Error('ZIP64-Archive werden für den IServ-Import nicht unterstützt.');
  }
  if (entryCount > MAX_ARCHIVE_ENTRIES) {
    throw new Error('Das ZIP-Archiv enthält zu viele Dateien.');
  }

  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    assertRange(view, offset, 46);
    if (view.getUint32(offset, true) !== CENTRAL_FILE_SIGNATURE) {
      throw new Error('Ungültiges ZIP-Archiv: Zentralverzeichnis ist beschädigt.');
    }

    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const headerLength = 46 + fileNameLength + extraLength + commentLength;
    assertRange(view, offset, headerLength);

    const path = new TextDecoder('utf-8').decode(
      bytes.subarray(offset + 46, offset + 46 + fileNameLength)
    );

    if ((flags & 0x1) !== 0) {
      throw new Error('Passwortgeschützte ZIP-Archive werden nicht unterstützt.');
    }

    if (!path.endsWith('/')) {
      entries.push({
        path,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset
      });
    }

    offset += headerLength;
  }

  return entries;
}

async function extractEntry(archive: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  assertRange(view, entry.localHeaderOffset, 30);
  if (view.getUint32(entry.localHeaderOffset, true) !== LOCAL_FILE_SIGNATURE) {
    throw new Error(`Ungültiger ZIP-Eintrag: ${entry.path}`);
  }

  const fileNameLength = view.getUint16(entry.localHeaderOffset + 26, true);
  const extraLength = view.getUint16(entry.localHeaderOffset + 28, true);
  const dataOffset = entry.localHeaderOffset + 30 + fileNameLength + extraLength;
  assertRange(view, dataOffset, entry.compressedSize);
  const compressed = archive.subarray(dataOffset, dataOffset + entry.compressedSize);

  let result: Uint8Array;
  if (entry.compressionMethod === 0) {
    result = new Uint8Array(compressed);
  } else if (entry.compressionMethod === 8) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Dieser Browser kann komprimierte ZIP-Dateien nicht lokal entpacken.');
    }
    const compressedBuffer = new ArrayBuffer(compressed.byteLength);
    new Uint8Array(compressedBuffer).set(compressed);
    const stream = new Blob([compressedBuffer]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    result = new Uint8Array(await new Response(stream).arrayBuffer());
  } else {
    throw new Error(`ZIP-Kompressionsmethode ${entry.compressionMethod} wird nicht unterstützt.`);
  }

  if (result.byteLength !== entry.uncompressedSize) {
    throw new Error(`ZIP-Eintrag konnte nicht vollständig gelesen werden: ${entry.path}`);
  }

  return result;
}

function findEndOfCentralDirectory(view: DataView): number {
  const minOffset = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      return offset;
    }
  }

  throw new Error('Die ausgewählte Datei ist kein gültiges ZIP-Archiv.');
}

function assertRange(view: DataView, offset: number, length: number): void {
  if (offset < 0 || length < 0 || offset + length > view.byteLength) {
    throw new Error('Ungültiges ZIP-Archiv: Dateigrenzen sind beschädigt.');
  }
}

function decodeCsvText(bytes: Uint8Array): string {
  const withoutBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
    ? bytes.subarray(3)
    : bytes;

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(withoutBom);
  } catch {
    return new TextDecoder('windows-1252').decode(withoutBom);
  }
}
