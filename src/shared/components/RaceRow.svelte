<script lang="ts">
  import TypeLabel from './TypeLabel.svelte';
  import StartLight from './StartLight.svelte';
  import { getRaceTypeKey } from '../utils/race-type';
  import type { RegistrationState } from '../utils/registration-status';

  export let title: string;
  /** Detail target: the title is the only anchor, its ::after covers the whole row. */
  export let href: string;
  export let dateLabel = '';
  export let location = '';
  export let type: string | null | undefined = '';
  /** From getRegistrationStatus(); null hides the registration part. */
  export let status: { state: RegistrationState; label: string } | null = null;
  export let registrationUrl: string | null | undefined = null;
  export let registerLabel = '';
  /** Shown instead of the button while registration is not open yet. */
  export let opensLabel = '';

  $: key = getRaceTypeKey(type);
  $: canRegister = !!registrationUrl && !!status && (status.state === 'open' || status.state === 'register');
</script>

<article class="race-row race-{key}">
  <span class="stripe" aria-hidden="true"></span>

  {#if dateLabel}
    <div class="date">{dateLabel}</div>
  {/if}

  <div class="main">
    <TypeLabel {type} />
    <h3 class="title"><a class="row-link" {href} on:click>{title}</a></h3>
    {#if location}
      <p class="location">{location}</p>
    {/if}
  </div>

  {#if status}
    <div class="action">
      <StartLight state={status.state} label={status.label} />
      {#if canRegister}
        <a class="register" href={registrationUrl} target="_blank" rel="noopener noreferrer">{registerLabel}</a>
      {:else if status.state === 'soon' && opensLabel}
        <span class="opens">{opensLabel}</span>
      {/if}
    </div>
  {/if}
</article>

<style>
  .race-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    padding-inline-start: calc(var(--spacing-md) + var(--spacing-xs));
    min-block-size: var(--touch-target-min);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    transition: border-color var(--transition-fast);
  }

  .race-row:hover,
  .race-row:focus-within {
    border-color: var(--color-primary);
  }

  .stripe {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: var(--spacing-xs);
    border-start-start-radius: var(--border-radius-lg);
    border-end-start-radius: var(--border-radius-lg);
    background: var(--race-unknown-stripe);
  }

  .race-cv .stripe { background: var(--race-cv-stripe); }
  .race-tc .stripe { background: var(--race-tc-stripe); }
  .race-cw .stripe { background: var(--race-cw-stripe); }
  .race-3nc .stripe { background: var(--race-3nc-stripe); }
  .race-ec .stripe { background: var(--race-ec-stripe); }
  .race-wc .stripe { background: var(--race-wc-stripe); }

  .date {
    flex: none;
    min-inline-size: 3.5rem;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xl);
    font-style: italic;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    text-transform: uppercase;
  }

  .main {
    flex: 1;
    min-inline-size: 0;
  }

  .title {
    margin: var(--spacing-xs) 0 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xl);
    font-style: italic;
    line-height: var(--line-height-tight);
  }

  .row-link {
    color: var(--color-text-primary);
    text-decoration: none;
  }

  /* Stretched link: the whole row is the click target */
  .row-link::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--border-radius-lg);
  }

  .row-link:focus-visible::after {
    outline: 2px solid var(--color-primary-hover);
    outline-offset: 2px;
  }

  .location {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .action {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-sm);
    flex: none;
  }

  .register {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-md);
    border-radius: var(--border-radius-md);
    background-color: var(--color-accent);
    color: var(--color-text-on-accent);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.06em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .register:hover {
    background-color: var(--color-accent-hover);
  }

  .opens {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
</style>
