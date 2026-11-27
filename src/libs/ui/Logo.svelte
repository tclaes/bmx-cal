<script lang="ts">
  /** Logo B1: gear ring with calendar page. `wordmark` adds the BMX / KALENDER text. */
  export let wordmark = true;
  export let size = 56;
  export let title = 'BMX Kalender';

  const teeth = Array.from({ length: 12 }, (_, i) => i * 30);
</script>

<span class="logo" class:with-wordmark={wordmark}>
  <svg
    class="mark"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    role="img"
    aria-label={wordmark ? undefined : title}
    aria-hidden={wordmark ? 'true' : undefined}
    focusable="false"
  >
    <circle cx="50" cy="50" r="40" class="ring" />
    {#each teeth as angle}
      <rect x="46" y="1" width="8" height="9" rx="2" class="tooth" transform="rotate({angle} 50 50)" />
    {/each}
    <rect x="35" y="36" width="30" height="28" rx="4" class="page" />
    <path d="M35 40a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v5H35z" class="header" />
    <rect x="42" y="32" width="2.4" height="7" rx="1.2" class="page" />
    <rect x="55.6" y="32" width="2.4" height="7" rx="1.2" class="page" />
    <circle cx="41.5" cy="51" r="2.3" class="dot" />
    <circle cx="50" cy="51" r="2.3" class="dot" />
    <circle cx="58.5" cy="51" r="2.3" class="dot" />
    <circle cx="41.5" cy="58" r="2.3" class="dot" />
    <circle cx="50" cy="58" r="2.3" class="dot" />
    <circle cx="58.5" cy="58" r="2.3" class="dot dot-today" />
  </svg>
  {#if wordmark}
    <span class="wordmark" aria-label={title}>
      <span class="word-bmx" aria-hidden="true">BMX</span>
      <span class="word-kalender" aria-hidden="true">KALENDER</span>
    </span>
  {/if}
</span>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm-plus);
  }

  .mark {
    display: block;
    flex: none;
  }

  .ring {
    fill: none;
    stroke: var(--color-primary);
    stroke-width: 6;
  }

  .tooth {
    fill: var(--color-primary);
  }

  .page {
    fill: var(--color-text-primary);
  }

  .header {
    fill: var(--color-accent-strong);
  }

  .dot {
    fill: var(--color-text-muted);
  }

  .dot-today {
    fill: var(--color-accent-strong);
  }

  .wordmark {
    display: flex;
    flex-direction: column;
    line-height: 1;
    font-family: var(--font-family);
    text-transform: uppercase;
  }

  .word-bmx {
    font-size: var(--font-size-2xl);
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--color-text-primary);
  }

  .word-kalender {
    margin-block-start: var(--spacing-xs);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.3em;
    color: var(--color-primary-hover);
  }
</style>
