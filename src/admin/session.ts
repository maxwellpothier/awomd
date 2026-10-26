import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Max's way into /admin: one password, `ADMIN_PASSWORD`, set in Vercel and
 * `.env.local`. No accounts, because there is one reader of that page.
 *
 * The cookie holds a keyed hash of the password rather than the password, so
 * the password never sits in a browser, and changing it signs every device
 * out. Unset, nobody gets in.
 */
export const adminCookie = "awomd_admin";

/** Signed in for a year per device, so a bookmark just opens the page. */
export const adminCookieMaxAge = 60 * 60 * 24 * 365;

function sign(password: string): string {
  return createHmac("sha256", password).update("awomd admin").digest("hex");
}

/** What the cookie should hold, or null when no password is set. */
export function adminToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password ? sign(password) : null;
}

/** Whether a typed password is the one. Compares hashes, so in fixed time. */
export function passwordMatches(typed: string): boolean {
  const expected = adminToken();
  return expected !== null && same(sign(typed), expected);
}

/** Whether this request carries a valid admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const expected = adminToken();
  const held = (await cookies()).get(adminCookie)?.value;
  return expected !== null && held !== undefined && same(held, expected);
}

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
