import { describe, expect, it } from "vitest";

import { attachmentPath, cleanName, formatSize, validateFiles } from "./attachments";

const pdf = { name: "a.pdf", type: "application/pdf", size: 1000 };

describe("validateFiles", () => {
  it("accepts up to five allowed files", () => {
    expect(validateFiles([pdf, pdf, pdf, pdf, pdf])).toBeNull();
  });

  it("rejects the sixth file, big files, foreign types and empty files", () => {
    expect(validateFiles(Array.from({ length: 6 }, () => pdf))).toBe("too_many");
    expect(validateFiles([{ ...pdf, size: 10 * 1024 * 1024 + 1 }])).toBe("too_large");
    expect(validateFiles([{ ...pdf, size: 10 * 1024 * 1024 }])).toBeNull();
    expect(validateFiles([{ ...pdf, type: "application/x-msdownload" }])).toBe("type");
    expect(validateFiles([{ ...pdf, size: 0 }])).toBe("invalid");
  });
});

describe("cleanName", () => {
  it("removes path separators and control characters", () => {
    expect(cleanName("../etc/passwd")).toBe("..-etc-passwd");
    expect(cleanName("a\\b\u0000.pdf")).toBe("a-b-.pdf");
    expect(cleanName("   ")).toBe("archivo");
    expect(cleanName("x".repeat(300))).toHaveLength(200);
  });
});

describe("attachmentPath and formatSize", () => {
  it("builds the storage path of the policy", () => {
    expect(attachmentPath("c1", "a1")).toBe("conversations/c1/a1");
  });

  it("formats kilobytes and megabytes", () => {
    const labels = { sizeKb: "{n} KB", sizeMb: "{n} MB" };
    expect(formatSize(100, labels)).toBe("1 KB");
    expect(formatSize(2048, labels)).toBe("2 KB");
    expect(formatSize(5 * 1024 * 1024, labels)).toBe("5.0 MB");
  });
});
