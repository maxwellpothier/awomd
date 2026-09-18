@AGENTS.md

# A Week on My Desk

Personal weekly music newsletter: Next.js site + email, sent Sundays at 4pm.

- Read `PLAN.md` before proposing architecture. It holds every decision made so far and the build order. Update it when a decision changes.
- Package manager is npm. Scripts run as `npm run <script>`.
- Issues are MDX files in the repo. Subscribers, sends, and tracking events are the only things in the database.
- Every content block has two renderers, web and email. Never add web-only markup to a block.
- Design system: cream page, navy banner and footer, orange accents. Source files in `assets/`.
