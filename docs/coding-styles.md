## Coding styles

### Use the `/modern-web-guidance` skill for web platform code

Before writing or changing HTML, CSS or client-side JavaScript/TypeScript (including the markup, styles and DOM code inside `.svelte` components), run the `/modern-web-guidance` skill and follow what it returns. Web APIs change quickly, and patterns from memory or older examples are often outdated.

Use it for, among other things:

- Dialogs, modals, popovers, banners and toasts
- Forms, validation and autofill
- Accessibility (focus management, ARIA, keyboard handling)
- Layout and responsive design (container queries, anchor positioning)
- Animations, transitions and scroll effects
- Performance (Core Web Vitals, images, loading priority)
- Security-sensitive DOM code (sanitizing HTML)
- Dates and time zones

You do not need it for backend or tooling work: SQL and migrations, Supabase edge functions, Vite or TypeScript config, CI, scripts, or tests that do not touch the DOM.

### Prefer native HTML over hand-built behaviour

When the platform has an element or API for something, use it instead of rebuilding it with `div`s and JavaScript. For example, the update prompts use `<dialog>`: `showModal()` provides the top layer, page inertness and focus handling, so no custom focus trap, `inert` toggling or extra z-index is needed.

### Project conventions

- Colours, spacing, radii, shadows and z-indexes come from tokens in `src/styles/variables.css`. Do not hardcode values in components.
- Touch targets are at least 44px (`--touch-target-min`). Mobile comes first.
- All user-facing text goes through i18n (`nl`, `fr`, `en`).
- Module boundaries are enforced by Sheriff; see `docs/architecture.md` and `docs/contribute.md`.

### About the skill

The skill lives in the project at `.claude/skills/modern-web-guidance/`, so every agent working in this repo has it.

- Source: [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance) (`skills/modern-web-guidance`), copied on 2026-11-13 from skill version `2026_11_09-5bcc021b`. Do not edit it by hand.
- It searches and retrieves guides through the CLI (`npx -y modern-web-guidance@latest search|retrieve …`), so it needs network access. `.claude/settings.json` allowlists exactly that command (`Bash(npx -y modern-web-guidance@latest:*)`); never widen it to a bare `npx *`.
- Only `SKILL.md` is kept in the repo. The guides are always fetched through the CLI (latest version), so the upstream `guides/` folder is not needed and is left out on purpose.
- To update it, reinstall from the source (for example `npx skills add GoogleChrome/modern-web-guidance`), copy only its `SKILL.md` over `.claude/skills/modern-web-guidance/SKILL.md` and update the version above.
