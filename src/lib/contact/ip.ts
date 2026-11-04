import { isIPv4, isIPv6 } from "node:net";

const unknownIp = "unknown";

function expandIpv6(address: string): number[] | null {
  const [head = "", tail, ...extra] = address.split("::");
  if (extra.length > 0) return null;
  const toGroups = (part: string) => (part === "" ? [] : part.split(":"));
  const headGroups = toGroups(head);
  const tailGroups = tail === undefined ? [] : toGroups(tail);
  const missing = 8 - headGroups.length - tailGroups.length;
  if (tail === undefined ? missing !== 0 : missing < 1) return null;
  const filler = Array<string>(tail === undefined ? 0 : missing).fill("0");
  const groups = [...headGroups, ...filler, ...tailGroups];
  const values = groups.map((group) => (/^[0-9a-f]{1,4}$/.test(group) ? parseInt(group, 16) : NaN));
  return values.length === 8 && values.every((value) => !Number.isNaN(value)) ? values : null;
}

function embeddedIpv4(address: string): string | null {
  const match = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address);
  const candidate = match?.[1];
  return candidate !== undefined && isIPv4(candidate) ? candidate : null;
}

export function normaliseIp(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim().toLowerCase().split("%")[0] ?? "";
  if (trimmed === "") return unknownIp;
  if (isIPv4(trimmed)) return trimmed;
  if (!isIPv6(trimmed)) return unknownIp;
  const mapped = embeddedIpv4(trimmed);
  if (mapped) return mapped;
  const groups = expandIpv6(trimmed);
  if (!groups) return unknownIp;
  return `${groups
    .slice(0, 4)
    .map((group) => group.toString(16))
    .join(":")}::/64`;
}

export function isKnownIp(raw: string | null | undefined): boolean {
  return normaliseIp(raw) !== unknownIp;
}

const encoder = new TextEncoder();

export async function hashIp(rawIp: string | null | undefined, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(normaliseIp(rawIp)));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
