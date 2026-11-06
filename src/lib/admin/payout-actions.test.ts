import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  type PayoutUploader,
  runBuildPayout,
  runDeletePayoutDraft,
  runIssuePayout,
  runPayPayout,
  runSetPayoutInvoice,
} from "./payout-actions";

const beneficiaryId = "00000000-0000-4000-8000-0000000000c2";
const id = "73000000-0000-4000-8000-000000000001";

function rpcClient(result: { data?: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

const build = {
  beneficiaryId,
  start: "2026-10-01",
  end: "2026-10-31",
  withholding: "15",
  note: "  Octubre ",
};

describe("runBuildPayout", () => {
  it("sends the period, the withholding and the trimmed note", async () => {
    const { client, rpc } = rpcClient({ data: id, error: null });
    expect(await runBuildPayout(client, build)).toEqual({ status: "done", id });
    expect(rpc).toHaveBeenCalledWith("build_payout", {
      p_beneficiary_id: beneficiaryId,
      p_period_start: "2026-10-01",
      p_period_end: "2026-10-31",
      p_withholding_rate: 15,
      p_note: "Octubre",
    });
  });

  it("defaults a blank withholding to zero and omits a blank note", async () => {
    const { client, rpc } = rpcClient({ data: id, error: null });
    await runBuildPayout(client, { ...build, withholding: " ", note: "" });
    expect(rpc).toHaveBeenCalledWith(
      "build_payout",
      expect.objectContaining({ p_withholding_rate: 0, p_note: undefined }),
    );
  });

  it.each([
    [{ ...build, beneficiaryId: "x" }, "beneficiary"],
    [{ ...build, start: "01/10/2026" }, "period"],
    [{ ...build, start: "2026-11-01", end: "2026-10-01" }, "period"],
    [{ ...build, start: "2024-01-01" }, "period"],
    [{ ...build, withholding: "150" }, "withholding"],
    [{ ...build, withholding: "abc" }, "withholding"],
  ])("rejects %j before the database", async (raw, field) => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runBuildPayout(client, raw)).toEqual({ status: "invalid", field });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps the typed errors", async () => {
    const empty = rpcClient({ error: { code: "P0001", message: "no_lines_in_period" } });
    expect(await runBuildPayout(empty.client, build)).toEqual({
      status: "failed",
      code: "no_lines_in_period",
    });
    const negative = rpcClient({ error: { code: "P0001", message: "negative_total" } });
    expect(await runBuildPayout(negative.client, build)).toEqual({
      status: "failed",
      code: "negative_total",
    });
    const denied = rpcClient({ error: { code: "42501", message: "x" } });
    expect(await runBuildPayout(denied.client, build)).toEqual({
      status: "failed",
      code: "forbidden",
    });
  });
});

describe("issue, pay and delete", () => {
  it("issues through set_payout_status", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runIssuePayout(client, { id })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("set_payout_status", { p_id: id, p_status: "issued" });
  });

  it("records the payment date and reference without executing anything else", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runPayPayout(client, { id, paidAt: "2026-11-02", reference: " TRF-1 " })).toEqual({
      status: "done",
    });
    expect(rpc).toHaveBeenCalledWith("set_payout_status", {
      p_id: id,
      p_status: "paid",
      p_paid_at: "2026-11-02",
      p_reference: "TRF-1",
    });
  });

  it("asks for a date and a reference", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runPayPayout(client, { id, paidAt: "", reference: "x" })).toEqual({
      status: "invalid",
      field: "date",
    });
    expect(await runPayPayout(client, { id, paidAt: "2026-11-02", reference: "  " })).toEqual({
      status: "invalid",
      field: "reference",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps transitions that are no longer allowed", async () => {
    const stale = rpcClient({ error: { code: "P0001", message: "invalid_transition" } });
    expect(await runIssuePayout(stale.client, { id })).toEqual({
      status: "failed",
      code: "invalid_transition",
    });
    expect(await runPayPayout(stale.client, { id, paidAt: "2026-11-02", reference: "x" })).toEqual({
      status: "failed",
      code: "invalid_transition",
    });
  });

  it("deletes drafts only", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runDeletePayoutDraft(client, { id })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("delete_payout_draft", { p_id: id });
    const issued = rpcClient({ error: { code: "P0001", message: "payout_not_draft" } });
    expect(await runDeletePayoutDraft(issued.client, { id })).toEqual({
      status: "failed",
      code: "payout_not_draft",
    });
  });
});

function uploader(ok = true) {
  return {
    upload: vi.fn().mockResolvedValue(ok),
    remove: vi.fn().mockResolvedValue(undefined),
  } satisfies PayoutUploader;
}

function form(file?: File) {
  const data = new FormData();
  data.set("id", id);
  if (file) data.set("file", file);
  return data;
}

const pdf = () => new File(["%PDF-1.4 x"], "f.pdf", { type: "application/pdf" });

describe("runSetPayoutInvoice", () => {
  it("uploads under the payouts folder and records the path", async () => {
    const { client, rpc } = rpcClient({ error: null });
    const files = uploader();
    expect(await runSetPayoutInvoice(client, files, form(pdf()))).toEqual({ status: "done" });
    const path = files.upload.mock.calls[0]?.[0] as string;
    expect(path).toMatch(new RegExp(`^payouts/${id}/[0-9a-f-]{36}\\.pdf$`));
    expect(rpc).toHaveBeenCalledWith("set_payout_invoice", { p_id: id, p_path: path });
  });

  it("removes the file when the database refuses the path", async () => {
    const { client } = rpcClient({ error: { code: "P0001", message: "invalid_path" } });
    const files = uploader();
    expect(await runSetPayoutInvoice(client, files, form(pdf()))).toEqual({
      status: "failed",
      code: "invalid_path",
    });
    expect(files.remove).toHaveBeenCalledTimes(1);
  });

  it("rejects missing, wrong or oversize files without uploading", async () => {
    const { client, rpc } = rpcClient({ error: null });
    const files = uploader();
    expect(await runSetPayoutInvoice(client, files, form())).toEqual({ status: "invalid" });
    expect(
      await runSetPayoutInvoice(
        client,
        files,
        form(new File(["x"], "a.png", { type: "image/png" })),
      ),
    ).toEqual({ status: "failed", code: "fileType" });
    expect(
      await runSetPayoutInvoice(
        client,
        files,
        form(new File(["no pdf"], "f.pdf", { type: "application/pdf" })),
      ),
    ).toEqual({ status: "failed", code: "fileType" });
    expect(
      await runSetPayoutInvoice(
        client,
        files,
        form(
          new File([new Uint8Array(10 * 1024 * 1024 + 1)], "f.pdf", { type: "application/pdf" }),
        ),
      ),
    ).toEqual({ status: "failed", code: "fileSize" });
    expect(files.upload).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reports an upload that fails or cannot run", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runSetPayoutInvoice(client, uploader(false), form(pdf()))).toEqual({
      status: "failed",
      code: "upload",
    });
    expect(await runSetPayoutInvoice(client, null, form(pdf()))).toEqual({
      status: "failed",
      code: "upload",
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
