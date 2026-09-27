"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { subscribeAction } from "@/content/site";

/** Looks like a whole address: something@something.something. */
const complete = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * How messy the stack under the field is (`.signup-form` in globals.css), from
 * what's typed: 1 when empty, 0 when square. The tidying is shared across the
 * address's three parts, so no one keystroke does most of it: the name before
 * the @ tidies it up to 40% of the way over ten characters, the domain up to
 * 35% more over five, and the ending after the last dot whatever is left over
 * three, so ".com" squares it a letter at a time rather than all on the "c",
 * however short the rest was.
 */
function mess(value: string) {
  const typed = value.trim();
  const at = typed.indexOf("@");
  const name = at === -1 ? typed : typed.slice(0, at);
  const host = at === -1 ? "" : typed.slice(at + 1);
  const dot = host.lastIndexOf(".");
  const domain = dot === -1 ? host : host.slice(0, dot);
  const ending = dot === -1 ? "" : host.slice(dot + 1);

  const share = (length: number, over: number, weight: number) =>
    Math.min(length / over, 1) * weight;
  const before = share(name.length, 10, 0.4) + share(domain.length, 5, 0.35);
  return (1 - before) * (1 - Math.min(ending.length / 3, 1));
}

/**
 * The email field with its send button inside it, on a messy stack of plates
 * that squares up as the address is typed. Still a plain form post, so it
 * works without JavaScript (the stack just stays messy); the script tidies the
 * stack and sets the arrow spinning (`.send-button`) while the post and
 * redirect are in flight.
 */
export function SignupForm() {
  const [pending, setPending] = useState(false);
  const form = useRef<HTMLFormElement>(null);

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
      ref={form}
      action={subscribeAction}
      method="post"
      onSubmit={submit}
      aria-busy={pending}
      className="signup-form relative mt-7 sm:mt-9"
    >
      <label className="sr-only" htmlFor="signup-email">
        Email address
      </label>
      <div className="signup-stack relative">
        <div className="signup-field relative">
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
            // Written straight to the form's style, not state, so typing
            // doesn't re-render. Autofill fires this too.
            onInput={(event) =>
              form.current?.style.setProperty("--mess", String(mess(event.currentTarget.value)))
            }
            // A two-letter ending (.co, .io) stops a step short of square
            // while typing, in case it's the start of .com. Leaving the field
            // with a complete address, as pressing the button does, squares it.
            onBlur={(event) => {
              if (complete.test(event.currentTarget.value.trim())) {
                form.current?.style.setProperty("--mess", "0");
              }
            }}
            className="signup-input h-[60px] w-full rounded-[14px] pl-5 pr-16 text-[17px] text-ink placeholder:text-ink-muted/70 focus:outline-none"
          />
          <button
            type="submit"
            aria-label={pending ? "Subscribing" : "Subscribe"}
            data-pending={pending || undefined}
            className="send-button absolute bottom-2 right-2 top-2 flex aspect-square rounded-[8px] bg-navy text-cream transition-colors hover:bg-navy-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <svg className="send-arrow" viewBox="0 0 24 24" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
