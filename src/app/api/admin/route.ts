import { adminCookie, adminCookieMaxAge, adminToken, passwordMatches } from "@/admin/session";

/**
 * The /admin sign-in form posts here, as does its Sign out button. Plain
 * form posts, like the signup, and every outcome is a 303 back to /admin.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const back = (query: string, cookie: string) =>
    new Response(null, {
      status: 303,
      headers: {
        Location: new URL(`/admin${query}`, request.url).toString(),
        "Set-Cookie": `${adminCookie}=${cookie}; Path=/admin; HttpOnly; SameSite=Lax${secure}`,
      },
    });

  if (form.get("signout") === "1") return back("", "; Max-Age=0");

  if (!passwordMatches(String(form.get("password") ?? ""))) {
    // A second's wait per wrong guess, so guessing by script is slow.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return Response.redirect(new URL("/admin?error=1", request.url), 303);
  }

  return back("", `${adminToken()}; Max-Age=${adminCookieMaxAge}`);
}
