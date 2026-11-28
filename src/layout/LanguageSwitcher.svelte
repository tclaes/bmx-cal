<script lang="ts">
  import { locale, t, SUPPORTED_LOCALES, isLocale } from '../i18n';
  import type { Locale } from '../i18n';

  /** `nav`: compact, in the desktop bar. `menu`: full-width row in the mobile menu. */
  export let variant: 'nav' | 'menu' = 'nav';

  // Each language in its own language, so it reads correctly whatever the current locale.
  const ENDONYMS: Record<Locale, string> = { en: 'English', nl: 'Nederlands', fr: 'Français' };

  const id = `language-select-${variant}`;

  function handleChange(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    if (isLocale(value)) locale.setLocale(value);
  }
</script>

<div class="language-switcher language-switcher--{variant}">
  {#if variant === 'menu'}
    <label class="language-label" for={id}>{$t.nav.language}</label>
  {/if}
  <span class="select-wrap">
    <select
      {id}
      class="language-select"
      value={$locale}
      aria-label={variant === 'nav' ? $t.nav.language : undefined}
      on:change={handleChange}
    >
      {#each SUPPORTED_LOCALES as code (code)}
        <option value={code} title={variant === 'nav' ? ENDONYMS[code] : undefined}>
          {variant === 'nav' ? code.toUpperCase() : ENDONYMS[code]}
        </option>
      {/each}
    </select>
  </span>
</div>

<style>
  .language-switcher {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .language-switcher--menu {
    justify-content: space-between;
  }

  .language-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
  }

  .select-wrap {
    position: relative;
    display: inline-flex;
  }

  /* Chevron drawn with borders in the text colour; the native popup is kept. */
  .select-wrap::after {
    content: '';
    position: absolute;
    inset-inline-end: var(--spacing-sm);
    inset-block-start: 50%;
    inline-size: calc(var(--spacing-xs) * 1.5);
    block-size: calc(var(--spacing-xs) * 1.5);
    border-inline-end: 2px solid currentcolor;
    border-block-end: 2px solid currentcolor;
    color: var(--color-text-muted);
    transform: translateY(-75%) rotate(45deg);
    pointer-events: none;
  }

  .language-select {
    appearance: none;
    font: inherit;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    padding-block: var(--spacing-xxs);
    padding-inline: var(--spacing-sm) var(--spacing-xl);
    cursor: pointer;
    transition: border-color var(--transition-base);
  }

  .language-select:hover {
    border-color: var(--color-text-muted);
  }

  .language-select:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .language-switcher--nav .language-select {
    font-size: var(--font-size-xs);
    letter-spacing: 0.04em;
    min-block-size: 2rem;
  }

  .language-switcher--menu .language-select {
    font-size: var(--font-size-base);
    min-block-size: var(--touch-target-min);
  }
</style>
