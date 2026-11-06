import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { UserRole } from "@/types/auth";
import type { Database } from "@/types/database";

import {
  deleteProjectDocument,
  type DocumentDeps,
  mapDocumentError,
  pathFor,
  signProjectDocument,
  statusOf,
  uploadProjectDocument,
} from "./project-documents";

const projectId = "60000000-0000-4000-8000-000000000001";
const documentId = "63000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-0000000000a2";

interface Setup {
  role?: UserRole;
  visible?: unknown[];
  uploadError?: boolean;
  registerError?: { code?: string; message?: string } | null;
  deleted?: unknown;
  deleteError?: { code?: string; message?: string } | null;
  found?: unknown[];
  signError?: boolean;
}

function deps(setup: Setup = {}) {
  const upload = vi.fn(() =>
    Promise.resolve({ error: setup.uploadError ? { message: "x" } : null }),
  );
  const remove = vi.fn(() => Promise.resolve({ error: null }));
  const createSignedUrl = vi.fn(() =>
    Promise.resolve(
      setup.signError
        ? { data: null, error: { message: "x" } }
        : { data: { signedUrl: "https://example.test/signed" }, error: null },
    ),
  );
  const serviceRpc = vi.fn(() => Promise.resolve({ error: setup.registerError ?? null }));
  const service = {
    storage: { from: () => ({ upload, remove, createSignedUrl }) },
    rpc: serviceRpc,
  } as unknown as SupabaseClient<Database>;
  const clientRpc = vi.fn(() =>
    Promise.resolve({ data: setup.deleted ?? null, error: setup.deleteError ?? null }),
  );
  const tables: string[] = [];
  const client = {
    from: (table: string) => ({
      select: () => {
        tables.push(table);
        return {
          eq: () =>
            Promise.resolve({
              data:
                table === "project_documents"
                  ? (setup.found ?? [])
                  : (setup.visible ?? [{ id: projectId }]),
              error: null,
            }),
        };
      },
    }),
    rpc: clientRpc,
  } as unknown as SupabaseClient<Database>;
  const value: DocumentDeps = {
    client,
    service,
    userId,
    role: setup.role ?? "client",
    newId: () => documentId,
  };
  return { value, upload, remove, serviceRpc, clientRpc, createSignedUrl, tables };
}

function form(overrides: Record<string, string | File | undefined> = {}) {
  const data = new FormData();
  const entries: Record<string, string | File | undefined> = {
    projectId,
    visibility: "client",
    file: new File(["hello"], "brief.pdf", { type: "application/pdf" }),
    ...overrides,
  };
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

describe("mapDocumentError and statusOf", () => {
  it("keeps typed errors and maps them to HTTP statuses", () => {
    expect(mapDocumentError({ code: "P0001", message: "project_quota_exceeded" })).toBe(
      "project_quota_exceeded",
    );
    expect(mapDocumentError({ code: "42501" })).toBe("forbidden");
    expect(mapDocumentError({ message: "boom" })).toBe("error");
    expect(statusOf("project_quota_exceeded")).toBe(409);
    expect(statusOf("document_not_found")).toBe(404);
    expect(statusOf("not_member")).toBe(403);
    expect(statusOf("invalid_mime")).toBe(400);
    expect(statusOf("storage_failed")).toBe(502);
  });
});

describe("uploadProjectDocument", () => {
  it("stores the file under the project path and registers it", async () => {
    const setup = deps();
    expect(await uploadProjectDocument(setup.value, form())).toEqual({
      status: "done",
      id: documentId,
    });
    expect(setup.upload).toHaveBeenCalledWith(pathFor(projectId, documentId), expect.any(File), {
      contentType: "application/pdf",
      upsert: false,
    });
    expect(setup.serviceRpc).toHaveBeenCalledWith("register_document", {
      p_project_id: projectId,
      p_uploaded_by: userId,
      p_name: "brief.pdf",
      p_mime: "application/pdf",
      p_size: 5,
      p_path: pathFor(projectId, documentId),
      p_visibility: "client",
    });
  });

  it("rejects bad requests before touching storage", async () => {
    const setup = deps();
    const code = async (data: FormData) => {
      const result = await uploadProjectDocument(setup.value, data);
      return result.status === "error" ? result.code : result.status;
    };
    expect(await code(form({ projectId: "nope" }))).toBe("invalid_request");
    expect(await code(form({ visibility: "everyone" }))).toBe("invalid_request");
    expect(await code(form({ file: undefined }))).toBe("file_missing");
    expect(await code(form({ file: new File([], "empty.pdf", { type: "application/pdf" }) }))).toBe(
      "file_missing",
    );
    expect(
      await code(form({ file: new File(["x"], "run.exe", { type: "application/x-msdownload" }) })),
    ).toBe("invalid_mime");
    const big = new File([new Uint8Array(26214401)], "big.zip", { type: "application/zip" });
    expect(await code(form({ file: big }))).toBe("file_too_large");
    expect(setup.upload).not.toHaveBeenCalled();
  });

  it("stops when the project is not visible to the caller", async () => {
    const setup = deps({ visible: [] });
    expect(await uploadProjectDocument(setup.value, form())).toEqual({
      status: "error",
      code: "project_not_found",
    });
    expect(setup.upload).not.toHaveBeenCalled();
  });

  it("reports storage failures and cleans up when registration is refused", async () => {
    const failed = deps({ uploadError: true });
    expect(await uploadProjectDocument(failed.value, form())).toEqual({
      status: "error",
      code: "storage_failed",
    });
    const refused = deps({ registerError: { code: "P0001", message: "project_quota_exceeded" } });
    expect(await uploadProjectDocument(refused.value, form())).toEqual({
      status: "error",
      code: "project_quota_exceeded",
    });
    expect(refused.remove).toHaveBeenCalledWith([pathFor(projectId, documentId)]);
  });

  it("checks membership on projects for a client and on freelance_projects for a freelance", async () => {
    const client = deps({ role: "client" });
    await uploadProjectDocument(client.value, form());
    expect(client.tables).toEqual(["projects"]);
    const freelance = deps({ role: "freelance" });
    await uploadProjectDocument(freelance.value, form());
    expect(freelance.tables).toEqual(["freelance_projects"]);
  });

  it("forces client visibility for a freelance", async () => {
    const setup = deps({ role: "freelance" });
    await uploadProjectDocument(setup.value, form({ visibility: "team" }));
    expect(setup.serviceRpc).toHaveBeenCalledWith(
      "register_document",
      expect.objectContaining({ p_visibility: "client" }),
    );
  });

  it("defaults the visibility to client", async () => {
    const setup = deps();
    await uploadProjectDocument(setup.value, form({ visibility: undefined }));
    expect(setup.serviceRpc).toHaveBeenCalledWith(
      "register_document",
      expect.objectContaining({ p_visibility: "client" }),
    );
  });
});

describe("deleteProjectDocument", () => {
  it("soft deletes and removes the stored object", async () => {
    const setup = deps({ deleted: pathFor(projectId, documentId) });
    expect(await deleteProjectDocument(setup.value, documentId)).toEqual({
      status: "done",
      id: documentId,
    });
    expect(setup.clientRpc).toHaveBeenCalledWith("delete_document", { p_id: documentId });
    expect(setup.remove).toHaveBeenCalledWith([pathFor(projectId, documentId)]);
  });

  it("validates the id and maps refusals", async () => {
    const setup = deps();
    expect(await deleteProjectDocument(setup.value, "x")).toEqual({
      status: "error",
      code: "invalid_request",
    });
    const refused = deps({ deleteError: { code: "42501", message: "forbidden" } });
    expect(await deleteProjectDocument(refused.value, documentId)).toEqual({
      status: "error",
      code: "forbidden",
    });
    expect(refused.remove).not.toHaveBeenCalled();
  });
});

describe("signProjectDocument", () => {
  it("signs a short lived download url for a visible document", async () => {
    const setup = deps({
      found: [{ storage_path: pathFor(projectId, documentId), name: "brief.pdf" }],
    });
    expect(await signProjectDocument(setup.value, documentId)).toEqual({
      status: "done",
      url: "https://example.test/signed",
    });
    expect(setup.createSignedUrl).toHaveBeenCalledWith(pathFor(projectId, documentId), 60, {
      download: "brief.pdf",
    });
  });

  it("hides documents the caller cannot read and survives signing errors", async () => {
    expect(await signProjectDocument(deps().value, documentId)).toEqual({
      status: "error",
      code: "document_not_found",
    });
    const broken = deps({ found: [{ storage_path: "p", name: "n" }], signError: true });
    expect(await signProjectDocument(broken.value, documentId)).toEqual({
      status: "error",
      code: "storage_failed",
    });
    expect(await signProjectDocument(deps().value, null)).toEqual({
      status: "error",
      code: "invalid_request",
    });
  });
});
