## ADDED Requirements

### Requirement: Colors are defined as design tokens
The app SHALL define all colors in `src/styles/colors.css` as CSS custom properties in two tiers: primitive palette tokens (`--palette-*`) and semantic tokens (`--color-*`) that reference the palette.

#### Scenario: Semantic token resolves through the palette
- **WHEN** a component uses `var(--color-primary)`
- **THEN** it resolves to a value defined by a `--palette-*` token in `colors.css`

#### Scenario: A needed color has no token
- **WHEN** a developer needs a color role not covered by existing semantic tokens
- **THEN** they add a semantic token (and a palette token if needed) in `colors.css` instead of writing a literal in the component

### Requirement: Components use semantic tokens only
Components (`.svelte`), stylesheets (`.css`) and TypeScript modules SHALL NOT contain literal color values (hex, `rgb()/rgba()`, `hsl()/hsla()`, other color functions, or named colors other than `transparent`, `currentColor`, `inherit`, `none`). They SHALL NOT reference `--palette-*` tokens directly.

#### Scenario: Hex color in a component
- **WHEN** a `.svelte` file contains `color: #2563eb`
- **THEN** `npm run stylelint` fails with a `color-no-hex` error

#### Scenario: Functional color in a component
- **WHEN** a `.svelte` file contains `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)`
- **THEN** `npm run stylelint` fails with a `function-disallowed-list` error

#### Scenario: Named color in a component
- **WHEN** a `.svelte` file contains `color: white`
- **THEN** `npm run stylelint` fails with a named-color error

#### Scenario: Token usage passes
- **WHEN** a component uses `color: var(--color-text-primary)` and `background: transparent`
- **THEN** `npm run stylelint` passes

#### Scenario: Alpha variant of a token
- **WHEN** a component needs a translucent variant of a token
- **THEN** it uses `color-mix(in srgb, var(--color-primary) 10%, transparent)` (or a dedicated token) and lint passes

### Requirement: The token file is the only exemption
Literal colors SHALL be permitted only in `src/styles/colors.css`.

#### Scenario: Palette definition
- **WHEN** `colors.css` defines `--palette-blue-600: #2563eb`
- **THEN** lint passes for that file

### Requirement: TypeScript does not hold color literals
Non-test `.ts` files under `src/` SHALL NOT contain color literals. Status and category colors SHALL be expressed as token names or `var(--color-*)` references.

#### Scenario: Registration status color
- **WHEN** `registration-status.ts` provides a color for "Registration Open"
- **THEN** it returns a `var(--color-status-open)` reference (or a key mapped to it), not `#047857`

#### Scenario: Guard test
- **WHEN** a non-test `.ts` file under `src/` contains `#[0-9a-f]{3,8}` as a color or `rgb(`
- **THEN** the Vitest guard test fails

### Requirement: Enforcement runs in CI
The Stylelint color rules SHALL run in CI and block merges to `master` on violation.

#### Scenario: PR introduces a raw color
- **WHEN** a pull request adds a literal color to a component
- **THEN** the CI stylelint step fails

### Requirement: Accessibility contrast is preserved
Text/background token pairs used for status and form feedback SHALL meet WCAG AA contrast (4.5:1 for normal text).

#### Scenario: Status badge
- **WHEN** a status color token is used as text on its light background token
- **THEN** the pair has contrast ≥ 4.5:1
