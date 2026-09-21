@AGENTS.md

# A Week on My Desk

Personal weekly music newsletter: Next.js site + email, sent Sundays at 4pm.

- Read `PLAN.md` before proposing architecture. It holds every decision made so far and the build order. Update it when a decision changes.
- Package manager is npm. Scripts run as `npm run <script>`.
- Issues are MDX files in the repo. Subscribers, sends, and tracking events are the only things in the database.
- Every content block has one renderer, email HTML, and the site shows that render inline. Never add markup email can't show.
- Design system: cream page, navy app bar, orange accents. The site is an inbox; the letter carries its own navy banner and footer. Source files in `assets/`.
