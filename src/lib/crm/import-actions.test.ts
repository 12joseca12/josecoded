import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { commitImport, previewImport } from "./import-actions";

const userId = "00000000-0000-4000-8000-0000000000c1";
const other = "00000000-0000-4000-8000-0000000000c2";
const closer = { userId, role: "closer" } as const;
const admin = { userId, role: "admin" } as const;
const mapping = { fullName: 0, email: 1, phone: 2, organization: 3, kind: 4, notes: 5 };

function fakeClient(options: {
  existing?: string[];
  imported?: boolean;
  rpc?: { data: unknown; error: { code?: string; message: string } | null };
}) {
  const rpc = vi.fn().mockResolvedValue(
    options.rpc ?? {
      data: { import_id: "i", created: 1, updated: 0, skipped: 0, invalid: 0 },
      error: null,
    },
  );
  const from = vi.fn((table: string) => {
    if (table === "contacts") {
      const chain = {
        eq: () => chain,
        is: () => chain,
        in: () =>
          Promise.resolve({
            data: (options.existing ?? []).map((email) => ({ email })),
            error: null,
          }),
      };
      return { select: () => chain };
    }
    const chain = {
      eq: () => chain,
      then: (resolve: (value: unknown) => void) => {
        resolve({
          data: options.imported ? [{ rows_created: 1, rows_updated: 0 }] : [],
          error: null,
        });
      },
    };
    return { select: () => chain };
  });
  return { client: { from, rpc } as unknown as SupabaseClient<Database>, rpc };
}

function form(content: string | Uint8Array, name = "a.csv", extra: Record<string, unknown> = {}) {
  const data = new FormData();
  data.set("file", new File([content as BlobPart], name, { type: "text/csv" }));
  data.set("options", JSON.stringify({ mapping: null, ownerId: "", ...extra }));
  return data;
}

const csv = "nombre,email,telefono,empresa,tipo,notas\nAna,ana@x.co,600,Ana SL,,\n";

describe("previewImport", () => {
  it("returns the verdicts, the mapping and the duplicates of the portfolio", async () => {
    const { client } = fakeClient({ existing: ["ana@x.co"] });
    const result = await previewImport(client, closer, form(csv));
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.data.mapping).toEqual(mapping);
    expect(result.data.totals).toMatchObject({ rows: 1, valid: 0, duplicates: 1 });
    expect(result.data.fileHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.data.alreadyImported).toBe(false);
  });

  it("re-validates the upload on the server", async () => {
    const { client } = fakeClient({});
    const cases: [Uint8Array | string, string, string][] = [
      [csv, "a.exe", "extension"],
      [new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]), "a.csv", "executable"],
      [new Uint8Array([0x61, 0x2c, 0x00, 0x0a]), "a.csv", "binary"],
      [new Uint8Array([0x61, 0x2c, 0xe9, 0x0a]), "a.csv", "encoding"],
      ["", "a.csv", "empty"],
      [`n\n${Array.from({ length: 501 }, (_, i) => `x${i}`).join("\n")}`, "a.csv", "tooManyRows"],
    ];
    for (const [content, name, reason] of cases) {
      expect(await previewImport(client, closer, form(content, name))).toEqual({
        status: "rejected",
        reason,
      });
    }
  });

  it("rejects a missing file and a foreign owner for a closer", async () => {
    const { client } = fakeClient({});
    const data = new FormData();
    data.set("options", JSON.stringify({ mapping: null, ownerId: "" }));
    expect(await previewImport(client, closer, data)).toEqual({
      status: "rejected",
      reason: "noFile",
    });
    expect(await previewImport(client, closer, form(csv, "a.csv", { ownerId: other }))).toEqual({
      status: "forbidden",
    });
    expect(
      (await previewImport(client, admin, form(csv, "a.csv", { ownerId: other }))).status,
    ).toBe("ready");
  });

  it("flags an already imported hash", async () => {
    const { client } = fakeClient({ imported: true });
    const result = await previewImport(client, closer, form(csv));
    expect(result.status === "ready" && result.data.alreadyImported).toBe(true);
  });
});

describe("commitImport", () => {
  it("sends only parsed, neutralised rows to the RPC", async () => {
    const { client, rpc } = fakeClient({});
    const content = `${csv}=BAD(),b@x.co,,,,\nNo,bad-email,,,,\nDup,ANA@x.co,,,,\n`;
    const result = await commitImport(
      client,
      closer,
      form(content, "a.csv", { mapping, onDuplicate: "update" }),
    );
    expect(result).toMatchObject({
      status: "done",
      summary: { created: 1, updated: 0, skipped: 1, invalid: 1 },
    });
    const args = rpc.mock.calls[0]?.[1] as { p_rows: { full_name: string }[]; p_owner_id: string };
    expect(args.p_rows.map((row) => row.full_name)).toEqual(["Ana", "'=BAD()"]);
    expect(args).toMatchObject({ p_on_duplicate: "update", p_owner_id: userId });
  });

  it("never calls the RPC for a rejected file or an unmapped name", async () => {
    const { client, rpc } = fakeClient({});
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]);
    expect(
      await commitImport(client, closer, form(exe, "a.csv", { mapping, onDuplicate: "skip" })),
    ).toEqual({ status: "rejected", reason: "executable" });
    expect(
      await commitImport(
        client,
        closer,
        form(csv, "a.csv", { mapping: { ...mapping, fullName: null }, onDuplicate: "skip" }),
      ),
    ).toEqual({ status: "missingName" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps database errors", async () => {
    const run = (error: { code?: string; message: string }) =>
      commitImport(
        fakeClient({ rpc: { data: null, error } }).client,
        closer,
        form(csv, "a.csv", { mapping, onDuplicate: "skip" }),
      );
    expect(await run({ code: "P0001", message: "already_imported" })).toEqual({
      status: "alreadyImported",
    });
    expect(await run({ code: "42501", message: "forbidden" })).toEqual({ status: "forbidden" });
    expect(await run({ code: "XX000", message: "boom" })).toEqual({ status: "error" });
  });
});
