import { Signup, type SignupState } from "@/components/site/Signup";

/**
 * Home is the signup form. This is the link that gets handed around.
 *
 * `?sent=1` and `?confirmed=1` show the two later steps of double opt-in;
 * the route handler and confirm endpoint will redirect here with them once
 * they exist.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state: SignupState =
    params.confirmed !== undefined
      ? "confirmed"
      : params.sent !== undefined
        ? "sent"
        : "form";
  return <Signup state={state} />;
}
