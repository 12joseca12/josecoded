import { describe, expect, it } from "vitest";

import { checkFileMeta, inspectBytes } from "./inspect";

const encoder = new TextEncoder();

describe("checkFileMeta", () => {
  it("accepts a csv with the usual MIME types", () => {
    for (const type of ["text/csv", "", "text/csv;charset=utf-8", "application/vnd.ms-excel"]) {
      expect(checkFileMeta({ name: "a.CSV", type, size: 10 })).toBeNull();
    }
  });

  it("rejects other extensions even with a csv MIME", () => {
    for (const name of ["a.exe", "a.csv.exe", "a.txt", "csv", ".csv", "a.xlsx"]) {
      expect(checkFileMeta({ name, type: "text/csv", size: 10 })).toBe("extension");
    }
  });

  it("rejects foreign MIME types, empty and oversized files", () => {
    expect(checkFileMeta({ name: "a.csv", type: "application/x-msdownload", size: 10 })).toBe(
      "mime",
    );
    expect(checkFileMeta({ name: "a.csv", type: "text/csv", size: 0 })).toBe("empty");
    expect(checkFileMeta({ name: "a.csv", type: "text/csv", size: 1_048_577 })).toBe("tooLarge");
  });
});

describe("inspectBytes", () => {
  it("returns the text and strips the byte order mark", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...encoder.encode("nombre\nAña")]);
    expect(inspectBytes(bytes)).toEqual({ text: "nombre\nAña" });
  });

  it.each([
    ["MZ", [0x4d, 0x5a, 0x90, 0x00]],
    ["ELF", [0x7f, 0x45, 0x4c, 0x46, 0x02]],
    ["PK", [0x50, 0x4b, 0x03, 0x04]],
    ["PDF", [0x25, 0x50, 0x44, 0x46, 0x2d]],
    ["shebang", [0x23, 0x21, 0x2f, 0x62]],
    ["gzip", [0x1f, 0x8b, 0x08]],
  ])("rejects the %s signature", (_name, head) => {
    expect(inspectBytes(new Uint8Array([...head, ...encoder.encode("a,b\n1,2")]))).toEqual({
      reason: "executable",
    });
  });

  it("rejects signatures hidden behind a byte order mark", () => {
    expect(inspectBytes(new Uint8Array([0xef, 0xbb, 0xbf, 0x4d, 0x5a]))).toEqual({
      reason: "executable",
    });
  });

  it("rejects NUL bytes and control characters", () => {
    expect(inspectBytes(encoder.encode("a,b\n1,\u00002"))).toEqual({ reason: "binary" });
    expect(inspectBytes(encoder.encode("a,b\n1,\u00072"))).toEqual({ reason: "binary" });
  });

  it("rejects invalid UTF-8", () => {
    expect(inspectBytes(new Uint8Array([0x61, 0x2c, 0xe9, 0x0a]))).toEqual({ reason: "encoding" });
  });

  it("rejects empty and oversized input", () => {
    expect(inspectBytes(new Uint8Array())).toEqual({ reason: "empty" });
    expect(inspectBytes(new Uint8Array(1_048_577).fill(0x61))).toEqual({ reason: "tooLarge" });
  });
});
