import { NextResponse, type NextRequest } from "next/server";
import { cleanRef, refCookie } from "@/content/site";

/**
 * Remembers which link brought a visitor: `awomd.com/?ref=ig` sets a cookie
 * that `/api/subscribe` reads, however many pages later they sign up.
 *
 * The first ref wins. A reader who arrives from a story and then taps the
 * letter's own "Forwarded this?" link still came from the story.
 *
 * Runs only on requests that carry a `ref` (see `config`), so every other
 * page view skips it entirely.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const ref = cleanRef(request.nextUrl.searchParams.get("ref"));
  if (ref && !request.cookies.has(refCookie)) {
    response.cookies.set(refCookie, ref, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next|brand|covers).*)",
      has: [{ type: "query", key: "ref" }],
    },
  ],
};
