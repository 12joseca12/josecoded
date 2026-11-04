import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { requestPathHeader } from "@/lib/auth/guards";

import { refreshSession } from "./proxy";

describe("refreshSession", () => {
  it("records the real path and ignores a spoofed header", async () => {
    const request = new NextRequest("http://localhost:3000/es/admin/interesados", {
      headers: { [requestPathHeader]: "/es/crm" },
    });
    const response = await refreshSession(request, {});
    expect(request.headers.get(requestPathHeader)).toBe("/es/admin/interesados");
    expect(response.status).toBe(200);
  });

  it("passes through untouched when Supabase is not configured", async () => {
    const request = new NextRequest("http://localhost:3000/es/entrar");
    const response = await refreshSession(request, {
      NEXT_PUBLIC_SUPABASE_URL: "https://evil.example",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_AbCdEf0123456789",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
