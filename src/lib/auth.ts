// Lightweight client-side password gate.
// NOTE: This is light protection (anyone can read the bundled hash). Fine for
// keeping casual visitors out of a personal/team tool — not real security.

// SHA-256("gogators!")
const PASSWORD_HASH =
  "25f46a91ebeccaf4100e5b2c4b24b88e3551f219552a98b30a712dd051a04530";

const STORAGE_KEY = "dr-auth-v1";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(input: string): Promise<boolean> {
  const h = await sha256Hex(input);
  return h === PASSWORD_HASH;
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "ok";
  } catch {
    return false;
  }
}

export function setAuthed(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, "ok");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
