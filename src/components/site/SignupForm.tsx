"use client";

import { useEffect, useState, type FormEvent } from "react";
import { subscribeAction } from "@/content/site";

/**
 * The email field with its send button inside it. Still a plain form post, so
 * it works without JavaScript; the script only sets the arrow spinning
 * (`.send-button` in globals.css) while the post and redirect are in flight.
 */
export function SignupForm() {
  const [pending, setPending] = useState(false);

  // Back from "check your email" can restore this page from the browser's
  // cache mid-spin. Start it over.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    setPending(true);
  }

  return (
    <form
      action={subscribeAction}
      method="post"
      onSubmit={submit}
      aria-busy={pending}
      className="relative mt-7 sm:mt-9"
    >
      <label className="sr-only" htmlFor="signup-email">
        Email address
      </label>
      <input
        id="signup-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="Your email address"
        // Not disabled: a disabled field is left out of the post.
        readOnly={pending}
        className="h-14 w-full rounded-[14px] border border-ink/20 bg-white/60 pl-5 pr-16 text-[17px] text-ink placeholder:text-ink-muted/70 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15"
      />
      <button
        type="submit"
        aria-label={pending ? "Subscribing" : "Subscribe"}
        data-pending={pending || undefined}
        className="send-button absolute bottom-1.5 right-1.5 top-1.5 flex aspect-square rounded-[8px] bg-navy text-cream transition-colors hover:bg-navy-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      >
        <svg className="send-arrow" viewBox="0 0 24 24" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
