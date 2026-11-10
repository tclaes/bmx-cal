<script lang="ts">
  import TypeLabel from './TypeLabel.svelte';
  import StartLight from './StartLight.svelte';
  import { getRaceTypeKey } from '@shared/utils';
  import type { RegistrationState } from '@shared/utils';

  export let title: string;
  /** Detail target: the title is the only anchor, its ::after covers the whole row. */
  export let href: string;
  export let day = '';
  export let month = '';
  /** Secondary line, e.g. "Zondag · Keerbergen". */
  export let meta = '';
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
  <div class="when">
    {#if day}<span class="day">{day}</span>{/if}
    {#if month}<span class="month">{month}</span>{/if}
    <TypeLabel {type} />
  </div>

  <div class="rail" aria-hidden="true"><span class="dot"></span></div>

  <div class="content">
    <h3 class="title"><a class="row-link" {href} on:click>{title}</a></h3>
    {#if meta}
      <p class="meta">{meta}</p>
    {/if}

    {#if status}
      <div class="status">
        <StartLight state={status.state} label={status.label} />
        {#if status.state === 'soon' && opensLabel}
          <span class="opens">{opensLabel}</span>
        {:else}
          <span class="status-label">{status.label}</span>
        {/if}
      </div>
      {#if canRegister}
        <div class="action">
          <a class="register" href={registrationUrl} target="_blank" rel="noopener noreferrer">{registerLabel}</a>
        </div>
      {/if}
    {/if}
  </div>
</article>

<style>
  .race-row {
    position: relative;
    display: grid;
    grid-template-columns: 3.5rem 1.25rem minmax(0, 1fr);
    column-gap: var(--spacing-md);
    padding-block: var(--spacing-md);
  }

  .when {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    font-family: var(--font-family-heading);
    font-style: italic;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    line-height: 1;
  }

  .day {
    font-size: var(--font-size-3xl);
    color: var(--color-text-primary);
  }

  .month {
    font-size: var(--font-size-sm);
    letter-spacing: 0.08em;
    color: var(--color-primary-hover);
  }

  /* Timeline: a vertical line through the dots of consecutive rows */
  .rail {
    position: relative;
    display: flex;
    justify-content: center;
  }

  .rail::before {
    content: '';
    position: absolute;
    inset-block: calc(var(--spacing-md) * -1);
    inline-size: 3px;
    background-color: var(--color-border);
  }

  .dot {
    position: relative;
    margin-block-start: var(--spacing-xs);
    inline-size: 14px;
    block-size: 14px;
    border-radius: var(--border-radius-full);
    border: 3px solid var(--race-unknown-ring);
    background-color: var(--color-bg-primary);
  }

  .race-cv .dot { border-color: var(--race-cv-ring); }
  .race-tc .dot { border-color: var(--race-tc-ring); }
  .race-cw .dot { border-color: var(--race-cw-ring); }
  .race-3nc .dot { border-color: var(--race-3nc-ring); }
  .race-ec .dot { border-color: var(--race-ec-ring); }
  .race-wc .dot { border-color: var(--race-wc-ring); }

  .content {
    min-inline-size: 0;
  }

  .title {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    overflow-wrap: break-word;
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
  }

  .row-link:focus-visible::after {
    outline: 2px solid var(--color-primary-hover);
    outline-offset: -2px;
    border-radius: var(--border-radius-md);
  }

  .race-row:hover .title {
    color: var(--color-primary-hover);
  }

  .meta {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
  }

  .status {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-block-start: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .status-label {
    font-weight: var(--font-weight-medium);
  }

  .action {
    position: relative;
    z-index: 1;
    margin-block-start: var(--spacing-sm);
  }

  .register {
    display: flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-md);
    border-radius: var(--border-radius-md);
    background-color: var(--color-accent);
    color: var(--color-text-on-accent);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.06em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .register:hover {
    background-color: var(--color-accent-hover);
  }
</style>
