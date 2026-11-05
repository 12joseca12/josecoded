export const visitorCookieName = "jc_visitor";
export const visitorCookieMaxAge = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();
const signatureLength = 32;
const tokenPattern = /^[0-9a-f]{64}$/;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function newVisitorToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashVisitorToken(token: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(token))));
}

async function signature(token: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${visitorCookieName}:${token}`),
  );
  return toHex(new Uint8Array(signed)).slice(0, signatureLength);
}

function sameText(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function signVisitorToken(token: string, secret: string): Promise<string> {
  return `${token}.${await signature(token, secret)}`;
}

export async function readVisitorCookie(
  value: string | undefined,
  secret: string,
): Promise<string | null> {
  if (value === undefined) return null;
  const [token, received, ...rest] = value.split(".");
  if (token === undefined || received === undefined || rest.length > 0) return null;
  if (!tokenPattern.test(token)) return null;
  return sameText(received, await signature(token, secret)) ? token : null;
}
