# Spec Delta

## ADDED Requirements

### Requirement: Spacing uses design tokens
All `margin`, `padding`, `gap`, `row-gap` and `column-gap` declarations in application styles SHALL use the `--spacing-*` tokens defined in `src/styles/variables.css`.

#### Scenario: Component styles use tokens
- **WHEN** a `.svelte` `<style>` block or a `.css` file under `src/` declares margin, padding or gap
- **THEN** every non-zero length is `var(--spacing-*)` or a `calc()` expression composed of such tokens

#### Scenario: Permitted literals
- **WHEN** a spacing declaration uses `0`, `auto`, `inherit`, `initial`, `unset` or a percentage
- **THEN** it is allowed without a token

#### Scenario: Changing a token
- **WHEN** the value of `--spacing-md` is changed in `variables.css`
- **THEN** every margin, padding and gap that used 16px reflects the new value without further edits

### Requirement: Spacing regression prevention
The lint step that runs in CI SHALL fail when a spacing declaration introduces a hard-coded `px`, `rem` or `em` length.

#### Scenario: Hard-coded value added
- **WHEN** a contributor adds `padding: 10px` or `padding: var(--spacing-sm) 0.75rem` to a component
- **THEN** `npm run stylelint` fails and reports the file and line

#### Scenario: Documented exception
- **WHEN** a declaration needs a literal for a technical reason, such as the visually-hidden `margin: -1px`
- **THEN** it carries a `stylelint-disable-next-line` comment that states the reason
