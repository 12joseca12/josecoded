import { describe, expect, it } from "vitest";

import { parseCsv } from "./parse";

function records(text: string) {
  const parsed = parseCsv(text);
  if (!parsed.ok) throw new Error(parsed.reason);
  return parsed.csv;
}

describe("parseCsv", () => {
  it("parses quoted fields, escaped quotes, embedded newlines and CRLF", () => {
    const csv = records('a,b\r\n"x, y","say ""hi"""\r\n"l1\nl2",z\r\n');
    expect(csv.headers).toEqual(["a", "b"]);
    expect(csv.records.map((row) => row.cells)).toEqual([
      ["x, y", 'say "hi"'],
      ["l1\nl2", "z"],
    ]);
    expect(csv.records.map((row) => row.line)).toEqual([2, 3]);
  });

  it("skips blank lines and strips the byte order mark", () => {
    const csv = records("﻿a,b\n\n1,2\n,\n");
    expect(csv.records).toHaveLength(1);
  });

  it("detects the semicolon delimiter", () => {
    expect(records("a;b\n1;2").records[0]?.cells).toEqual(["1", "2"]);
  });

  it("rejects malformed quoting", () => {
    expect(parseCsv('a,b\n"open,2')).toEqual({ ok: false, reason: "malformed" });
    expect(parseCsv('a,b\nx"y,2')).toEqual({ ok: false, reason: "malformed" });
    expect(parseCsv('a,b\n"x"y,2')).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects files without a header", () => {
    expect(parseCsv("\n\n")).toEqual({ ok: false, reason: "noHeader" });
  });

  it("caps rows and columns", () => {
    const rows = Array.from({ length: 501 }, (_, index) => `n${index}`).join("\n");
    expect(parseCsv(`name\n${rows}`)).toEqual({ ok: false, reason: "tooManyRows" });
    expect(parseCsv(`name\n${rows.split("\n").slice(0, 500).join("\n")}`).ok).toBe(true);
    expect(parseCsv(Array.from({ length: 41 }, (_, i) => `c${i}`).join(","))).toEqual({
      ok: false,
      reason: "tooManyColumns",
    });
  });
});
