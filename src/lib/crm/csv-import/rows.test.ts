import { describe, expect, it } from "vitest";

import { importTemplateHeaders } from "@/types/crm-import";

import { parseCsv } from "./parse";
import { csvCell, errorReportCsv, templateCsv } from "./report";
import { classify, evaluateFile, suggestMapping } from "./rows";

function run(text: string, existing: string[] = []) {
  const parsed = parseCsv(text);
  if (!parsed.ok) throw new Error(parsed.reason);
  const mapping = suggestMapping(parsed.csv.headers);
  return classify(evaluateFile(parsed.csv, mapping), new Set(existing));
}

const head = "nombre,email,telefono,empresa,tipo,notas\n";

describe("suggestMapping", () => {
  it("maps the template headers and common aliases", () => {
    expect(suggestMapping([...importTemplateHeaders])).toEqual({
      fullName: 0,
      email: 1,
      phone: 2,
      organization: 3,
      kind: 4,
      notes: 5,
    });
    expect(suggestMapping(["Teléfono", "Correo electrónico", "Name"])).toMatchObject({
      phone: 0,
      email: 1,
      fullName: 2,
    });
  });
});

describe("classify", () => {
  it("accepts valid rows and normalises email and kind", () => {
    const result = run(`${head}Ana,ANA@Example.com,+34 600 111 222,Ana SL,cliente,hola\n`);
    expect(result.totals).toMatchObject({ rows: 1, valid: 1, invalid: 0, duplicates: 0 });
    expect(result.importable[0]).toMatchObject({
      email: "ana@example.com",
      kind: "client",
      phone: "+34 600 111 222",
    });
  });

  it("flags every kind of invalid row", () => {
    const result = run(
      `${head},a@b.co,,,,\nBad,no-at,,,,\nBad,,=1+1,,,\nBad,,,,alien,\nShort,only\nBad,=cmd@x.co,,,,\n`,
    );
    expect(result.totals.invalid).toBe(6);
    expect(result.problems.map((row) => row.problems)).toEqual([
      ["fullName"],
      ["email"],
      ["phone"],
      ["kind"],
      ["columns"],
      ["email"],
    ]);
    expect(result.importable).toHaveLength(0);
  });

  it("neutralises formula starts in free text with an apostrophe", () => {
    const result = run(`${head}"=HYPERLINK(""x"")",,,@acme,,-10%\n\t=cmd,,,,,+1\n`);
    expect(result.importable.map((row) => [row.fullName, row.organization, row.notes])).toEqual([
      ['\'=HYPERLINK("x")', "'@acme", "'-10%"],
      ["'=cmd", "", "'+1"],
    ]);
    expect(result.totals.neutralized).toBe(2);
  });

  it("reports duplicates against existing contacts and inside the file", () => {
    const result = run(`${head}A,a@x.co,,,,\nB,b@x.co,,,,\nC,B@x.co,,,,\nD,,,,,\n`, ["a@x.co"]);
    expect(result.totals).toMatchObject({ valid: 2, duplicates: 2, invalid: 0 });
    expect(result.problems.map((row) => [row.line, row.problems])).toEqual([
      [2, []],
      [4, ["duplicateInFile"]],
    ]);
    expect(result.importable.map((row) => row.fullName)).toEqual(["A", "B", "D"]);
  });
});

describe("csv output", () => {
  it("neutralises and quotes cells", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("\tx")).toBe("'\tx");
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("plain")).toBe("plain");
  });

  it("builds the template and the error report", () => {
    expect(templateCsv()).toBe("nombre,email,telefono,empresa,tipo,notas\r\n");
    const report = errorReportCsv(
      ["nombre"],
      [{ line: 3, cells: ["=x"], verdict: "invalid", problems: ["email"] }],
      {
        report: { line: "line", problem: "problem", status: { duplicate: "dup", invalid: "err" } },
        problems: {
          columns: "c",
          fullName: "n",
          email: "bad email",
          phone: "p",
          organization: "o",
          kind: "k",
          notes: "t",
          duplicateInFile: "d",
        },
      },
    );
    expect(report).toBe("﻿line,problem,nombre\r\n3,err; bad email,'=x\r\n");
  });
});
