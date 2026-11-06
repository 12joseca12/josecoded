import { importFileExtension, importMaxBytes, type ImportRejection } from "@/types/crm-import";

interface Signature {
  bytes: readonly number[];
}

const executableSignatures: readonly Signature[] = [
  { bytes: [0x4d, 0x5a] },
  { bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { bytes: [0x50, 0x4b] },
  { bytes: [0x25, 0x50, 0x44, 0x46] },
  { bytes: [0x23, 0x21] },
  { bytes: [0x1f, 0x8b] },
  { bytes: [0x37, 0x7a, 0xbc, 0xaf] },
  { bytes: [0x52, 0x61, 0x72, 0x21] },
  { bytes: [0xd0, 0xcf, 0x11, 0xe0] },
  { bytes: [0xca, 0xfe, 0xba, 0xbe] },
  { bytes: [0xcf, 0xfa, 0xed, 0xfe] },
  { bytes: [0xce, 0xfa, 0xed, 0xfe] },
  { bytes: [0xfe, 0xed, 0xfa, 0xce] },
  { bytes: [0xfe, 0xed, 0xfa, 0xcf] },
  { bytes: [0x89, 0x50, 0x4e, 0x47] },
  { bytes: [0xff, 0xd8, 0xff] },
  { bytes: [0x47, 0x49, 0x46, 0x38] },
];

const allowedMimeTypes = new Set(["", "text/csv"]);
const spreadsheetMime = "application/vnd.ms-excel";
const byteOrderMark = [0xef, 0xbb, 0xbf];

export function hasCsvExtension(name: string): boolean {
  return (
    name.toLowerCase().endsWith(importFileExtension) && name.length > importFileExtension.length
  );
}

export function checkFileMeta(file: {
  name: string;
  type: string;
  size: number;
}): ImportRejection | null {
  if (!hasCsvExtension(file.name)) return "extension";
  const mime = file.type.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!allowedMimeTypes.has(mime) && mime !== spreadsheetMime) return "mime";
  if (file.size === 0) return "empty";
  if (file.size > importMaxBytes) return "tooLarge";
  return null;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function isControl(code: number): boolean {
  return code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d;
}

export function inspectBytes(bytes: Uint8Array): { text: string } | { reason: ImportRejection } {
  if (bytes.length === 0) return { reason: "empty" };
  if (bytes.length > importMaxBytes) return { reason: "tooLarge" };
  const body = startsWith(bytes, byteOrderMark) ? bytes.subarray(byteOrderMark.length) : bytes;
  if (executableSignatures.some((signature) => startsWith(body, signature.bytes))) {
    return { reason: "executable" };
  }
  for (const value of body) {
    if (value === 0 || isControl(value)) return { reason: "binary" };
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    return { reason: "encoding" };
  }
  return { text };
}
