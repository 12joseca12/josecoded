import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  type InvoiceUploader,
  parseRate,
  runCancelItem,
  runIssueProforma,
  runRecordInvoice,
  runRecordPayment,
  runSetSchedule,
  runVoidInvoice,
} from "./payment-actions";

const dealId = "30000000-0000-4000-8000-0000000000a2";
const scheduleId = "70000000-0000-4000-8000-000000000001";

function rpcClient(result: { data?: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  const maybeSingle = vi.fn().mockResolvedValue({ data: { number: "PF-2026-001" }, error: null });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
  });
  return { client: { rpc, from } as unknown as SupabaseClient<Database>, rpc };
}

const payment = {
  dealId,
  scheduleId,
  invoiceId: "",
  kind: "payment",
  nature: "project",
  amount: "1.400,50",
  receivedAt: "2026-10-20",
  method: "transfer",
  reference: " REF ",
};

describe("parseRate", () => {
  it("accepts percentages with up to two decimals and a comma", () => {
    expect(parseRate("21")).toBe(21);
    expect(parseRate("7,5")).toBe(7.5);
    expect(parseRate("0")).toBe(0);
    expect(parseRate("100")).toBe(100);
  });

  it.each(["", "101", "-1", "1.234", "abc", "10 %"])("rejects %s", (value) => {
    expect(parseRate(value)).toBeNull();
  });
});

describe("runRecordPayment", () => {
  it("sends euros from the typed cents and omits blank optionals", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runRecordPayment(client, payment)).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("record_payment", {
      p_deal_id: dealId,
      p_kind: "payment",
      p_nature: "project",
      p_amount_net: 1400.5,
      p_received_at: "2026-10-20",
      p_method: "transfer",
      p_schedule_id: scheduleId,
      p_invoice_id: undefined,
      p_reference: "REF",
    });
  });

  it.each([
    [{ ...payment, dealId: "x" }, "deal"],
    [{ ...payment, receivedAt: "20/10/2026" }, "date"],
    [{ ...payment, amount: "" }, "amount"],
    [{ ...payment, amount: "0" }, "amount"],
    [{ ...payment, amount: "1,234" }, "amount"],
  ])("rejects %j before the database", async (raw, field) => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runRecordPayment(client, raw)).toEqual({ status: "invalid", field });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps typed database errors and unknown ones", async () => {
    const exceeds = rpcClient({ error: { code: "P0001", message: "payment_exceeds_schedule" } });
    expect(await runRecordPayment(exceeds.client, payment)).toEqual({
      status: "failed",
      code: "payment_exceeds_schedule",
    });
    const denied = rpcClient({ error: { code: "42501", message: "whatever" } });
    expect(await runRecordPayment(denied.client, payment)).toEqual({
      status: "failed",
      code: "forbidden",
    });
    const unknown = rpcClient({ error: { code: "XX000", message: "boom" } });
    expect(await runRecordPayment(unknown.client, payment)).toEqual({
      status: "failed",
      code: "error",
    });
  });
});

describe("runSetSchedule", () => {
  const items = [
    { label: "Anticipo", kind: "milestone", percent: "40", amount: "400", dueAt: "2026-12-01" },
    { label: "Final", kind: "milestone", percent: "", amount: "600,00", dueAt: "" },
  ];

  it("converts the drafts into the RPC contract", async () => {
    const { client, rpc } = rpcClient({ data: 2, error: null });
    expect(await runSetSchedule(client, { dealId, items })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("set_payment_schedule", {
      p_deal_id: dealId,
      p_items: [
        { label: "Anticipo", kind: "milestone", percent: 40, amount: 400, due_at: "2026-12-01" },
        { label: "Final", kind: "milestone", percent: null, amount: 600, due_at: null },
      ],
    });
  });

  it("rejects empty schedules, bad amounts and bad percentages", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runSetSchedule(client, { dealId, items: [] })).toEqual({
      status: "invalid",
      field: "items",
    });
    expect(await runSetSchedule(client, { dealId, items: [{ ...items[0], amount: "0" }] })).toEqual(
      { status: "invalid", field: "items" },
    );
    expect(
      await runSetSchedule(client, { dealId, items: [{ ...items[0], percent: "150" }] }),
    ).toEqual({ status: "invalid", field: "items" });
    expect(await runSetSchedule(client, { dealId: "x", items })).toEqual({
      status: "invalid",
      field: "deal",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps the total mismatch", async () => {
    const { client } = rpcClient({ error: { code: "P0001", message: "schedule_total_mismatch" } });
    expect(await runSetSchedule(client, { dealId, items })).toEqual({
      status: "failed",
      code: "schedule_total_mismatch",
    });
  });
});

describe("runIssueProforma", () => {
  it("issues with the typed VAT and returns the number", async () => {
    const { client, rpc } = rpcClient({
      data: "71000000-0000-4000-8000-000000000009",
      error: null,
    });
    expect(await runIssueProforma(client, { scheduleId, vat: "0" })).toEqual({
      status: "done",
      id: "71000000-0000-4000-8000-000000000009",
      number: "PF-2026-001",
    });
    expect(rpc).toHaveBeenCalledWith("issue_proforma", {
      p_schedule_id: scheduleId,
      p_vat_rate: 0,
    });
  });

  it("rejects a VAT outside 0 to 100 and maps duplicates", async () => {
    const { client, rpc } = rpcClient({
      error: { code: "P0001", message: "proforma_already_issued" },
    });
    expect(await runIssueProforma(client, { scheduleId, vat: "101" })).toEqual({
      status: "invalid",
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(await runIssueProforma(client, { scheduleId, vat: "21" })).toEqual({
      status: "failed",
      code: "proforma_already_issued",
    });
  });
});

function invoiceForm(file?: File) {
  const data = new FormData();
  data.set("dealId", dealId);
  data.set("scheduleId", scheduleId);
  data.set("number", " F-2026/0001 ");
  data.set("issuedAt", "2026-10-25");
  data.set("net", "1400");
  data.set("vat", "21");
  if (file) data.set("file", file);
  return data;
}

function uploader(ok = true): InvoiceUploader & {
  upload: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
} {
  return { upload: vi.fn().mockResolvedValue(ok), remove: vi.fn().mockResolvedValue(undefined) };
}

const pdf = () => new File(["%PDF-1.4 body"], "f.pdf", { type: "application/pdf" });

describe("runRecordInvoice", () => {
  it("records an invoice without a file", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runRecordInvoice(client, null, invoiceForm())).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("record_invoice", {
      p_deal_id: dealId,
      p_number: "F-2026/0001",
      p_issued_at: "2026-10-25",
      p_net: 1400,
      p_vat_rate: 21,
      p_schedule_id: scheduleId,
      p_pdf_path: undefined,
    });
  });

  it("uploads a real PDF under the deal folder before recording", async () => {
    const { client, rpc } = rpcClient({ error: null });
    const files = uploader();
    expect(await runRecordInvoice(client, files, invoiceForm(pdf()))).toEqual({ status: "done" });
    const path = files.upload.mock.calls[0]?.[0] as string;
    expect(path).toMatch(new RegExp(`^${dealId}/[0-9a-f-]{36}\\.pdf$`));
    expect(rpc).toHaveBeenCalledWith(
      "record_invoice",
      expect.objectContaining({ p_pdf_path: path }),
    );
    expect(files.remove).not.toHaveBeenCalled();
  });

  it("removes the uploaded file when the database refuses the invoice", async () => {
    const { client } = rpcClient({ error: { code: "P0001", message: "invoice_number_taken" } });
    const files = uploader();
    expect(await runRecordInvoice(client, files, invoiceForm(pdf()))).toEqual({
      status: "failed",
      code: "invoice_number_taken",
    });
    expect(files.remove).toHaveBeenCalledTimes(1);
  });

  it("rejects wrong types, fake PDFs and oversize files without uploading", async () => {
    const { client, rpc } = rpcClient({ error: null });
    const files = uploader();
    const png = new File(["x"], "a.png", { type: "image/png" });
    const fake = new File(["not a pdf"], "f.pdf", { type: "application/pdf" });
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "f.pdf", {
      type: "application/pdf",
    });
    expect(await runRecordInvoice(client, files, invoiceForm(png))).toEqual({
      status: "failed",
      code: "fileType",
    });
    expect(await runRecordInvoice(client, files, invoiceForm(fake))).toEqual({
      status: "failed",
      code: "fileType",
    });
    expect(await runRecordInvoice(client, files, invoiceForm(big))).toEqual({
      status: "failed",
      code: "fileSize",
    });
    expect(files.upload).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reports an upload failure without calling the database", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await runRecordInvoice(client, uploader(false), invoiceForm(pdf()))).toEqual({
      status: "failed",
      code: "upload",
    });
    expect(await runRecordInvoice(client, null, invoiceForm(pdf()))).toEqual({
      status: "failed",
      code: "upload",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("validates the fields", async () => {
    const { client } = rpcClient({ error: null });
    const bad = invoiceForm();
    bad.set("number", "  ");
    expect(await runRecordInvoice(client, null, bad)).toEqual({
      status: "invalid",
      field: "number",
    });
    const noVat = invoiceForm();
    noVat.set("vat", "x");
    expect(await runRecordInvoice(client, null, noVat)).toEqual({
      status: "invalid",
      field: "vat",
    });
    const noNet = invoiceForm();
    noNet.set("net", "0");
    expect(await runRecordInvoice(client, null, noNet)).toEqual({
      status: "invalid",
      field: "net",
    });
  });
});

describe("confirm actions", () => {
  it("cancel and void call their RPCs and map typed errors", async () => {
    const ok = rpcClient({ error: null });
    expect(await runCancelItem(ok.client, { id: scheduleId })).toEqual({ status: "done" });
    expect(ok.rpc).toHaveBeenCalledWith("cancel_schedule_item", { p_id: scheduleId });
    expect(await runVoidInvoice(ok.client, { id: scheduleId })).toEqual({ status: "done" });
    expect(ok.rpc).toHaveBeenCalledWith("void_invoice", { p_id: scheduleId });
    const blocked = rpcClient({ error: { code: "P0001", message: "schedule_has_payments" } });
    expect(await runCancelItem(blocked.client, { id: scheduleId })).toEqual({
      status: "failed",
      code: "schedule_has_payments",
    });
    expect(await runVoidInvoice(blocked.client, { id: "nope" })).toEqual({
      status: "failed",
      code: "error",
    });
  });
});
