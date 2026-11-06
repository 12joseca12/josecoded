import type { ServerSupabase } from "@/lib/supabase/server";
import type { AccountSignIn, AccountSource } from "@/types/account";

export async function fetchSignIn(client: ServerSupabase): Promise<AccountSource<AccountSignIn>> {
  try {
    const { data, error } = await client.auth.getUser();
    if (error) return { status: "error" };
    const providers = (data.user.identities ?? []).map((identity) => identity.provider);
    return { status: "ok", data: { google: providers.includes("google") } };
  } catch {
    return { status: "error" };
  }
}

export async function fetchTotpEnrolled(client: ServerSupabase): Promise<AccountSource<boolean>> {
  try {
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) return { status: "error" };
    return { status: "ok", data: data.totp.length > 0 };
  } catch {
    return { status: "error" };
  }
}
