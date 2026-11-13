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

### Keep it simple: KISS and YAGNI

- **KISS (Keep It Simple):** choose the most straightforward solution that works. Prefer plain functions and clear names over clever constructs or extra layers.
- **YAGNI (You Aren't Gonna Need It):** build only what is needed now. No speculative options, abstractions, parameters or configuration "for later"; add them when a real use case appears.

### Prefer early returns over if/else

Avoid `if/else` constructions where possible. Handle the special or failing cases first and return early, so the main path reads top to bottom without nesting:

```ts
// Avoid
function label(state: UpdateState): string {
  if (state === 'mandatory') {
    return t.updateRequired;
  } else {
    if (state === 'optional') {
      return t.newVersion;
    } else {
      return t.latestVersion;
    }
  }
}

// Prefer
function label(state: UpdateState): string {
  if (state === 'mandatory') return t.updateRequired;
  if (state === 'optional') return t.newVersion;
  return t.latestVersion;
}
```

Use a lookup object when every branch only maps a value to another value.

### Prefer native HTML over hand-built behaviour

When the platform has an element or API for something, use it instead of rebuilding it with `div`s and JavaScript. For example, the mandatory update dialog (`UpdateRequired.svelte`) uses `<dialog>` with `showModal()`, which provides the top layer, page inertness and focus handling, so no custom focus trap, `inert` toggling or extra z-index is needed. The optional banner (`UpdatePrompt.svelte`) is a non-modal `<dialog open>`, so the app stays usable.

### Project conventions

- Colours come from `var(--color-*)` tokens in `src/styles/colors.css` (never hex, `rgb()`, `hsl()` or named colors in components). Spacing, radii, shadows and z-indexes come from tokens in `src/styles/variables.css`. Do not hardcode values in components.
- Touch targets are at least 44px (`--touch-target-min`). Mobile comes first.
- All user-facing text goes through i18n (`nl`, `fr`, `en`).
- Module boundaries are enforced by Sheriff; see `docs/architecture.md` and `docs/contribute.md`.

### Review with the `/code-review-and-quality` skill when the implementation is done

When an implementation is finished (all tasks done, tests green) and before it is committed for a pull request, run the `/code-review-and-quality` skill on the change. It reviews five axes: correctness, readability, architecture, security and performance.

- Label every finding: **Critical** (blocks merge), required (no prefix), **Consider**, **Nit** or **FYI**.
- Fix every Critical and required finding before the PR is opened, or record why it is deferred.
- Follow-up changes after review feedback get a quick review too.

The skill lives in the project at `.claude/skills/code-review-and-quality/SKILL.md`. Source: [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (`skills/code-review-and-quality`), copied on 2026-11-13. Do not edit it by hand; to update it, reinstall from the source and copy its `SKILL.md` over. Its "See Also" links (`references/security-checklist.md`, `references/performance-checklist.md`) and its mentions of the `security-and-hardening` and `performance-optimization` skills point to upstream resources that are not part of this repo. Ignore them; the five axes in the skill itself are the review standard here.

### About the `modern-web-guidance` skill

The skill lives in the project at `.claude/skills/modern-web-guidance/`, so every agent working in this repo has it.

- Source: [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance) (`skills/modern-web-guidance`), copied on 2026-11-13 from skill version `2026_11_09-5bcc021b`. Do not edit it by hand.
- It searches and retrieves guides through the CLI (`npx -y modern-web-guidance@latest search|retrieve …`), so it needs network access. `.claude/settings.json` allowlists exactly that command (`Bash(npx -y modern-web-guidance@latest:*)`); never widen it to a bare `npx *`.
- Only `SKILL.md` is kept in the repo. The guides are always fetched through the CLI (latest version), so the upstream `guides/` folder is not needed and is left out on purpose.
- To update it, reinstall from the source (for example `npx skills add GoogleChrome/modern-web-guidance`), copy only its `SKILL.md` over `.claude/skills/modern-web-guidance/SKILL.md` and update the version above.
