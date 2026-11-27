<script lang="ts">
  import { getRaceTypeKey, getRaceTypeCode } from '@shared/utils';

  /** Event type name ("European Cup") or code ("EC"). */
  export let type: string | null | undefined = '';
  /** Overrides the text (e.g. "ALL"); a label without a type renders no dot. */
  export let label = '';
  export let count: number | null = null;
  /** off = not selected, on = selected, partial = some of its items selected. */
  export let state: 'off' | 'on' | 'partial' = 'off';
  export let title: string | undefined = undefined;

  $: key = getRaceTypeKey(type);
  $: hasType = !!(type ?? '').trim();
  $: text = label || (key === 'unknown' ? (type ?? '').trim() : getRaceTypeCode(type));
  $: pressed = (state === 'on' ? 'true' : state === 'partial' ? 'mixed' : 'false') as 'true' | 'mixed' | 'false';
</script>

<button
  type="button"
  class="chip"
  class:on={state === 'on'}
  class:partial={state === 'partial'}
  class:plain={!hasType}
  aria-pressed={pressed}
  title={title ?? (type || undefined)}
  on:click
>
  {#if hasType}<span class="dot dot-{key}" aria-hidden="true"></span>{/if}
  <span class="text">{text}</span>
  {#if count !== null}<span class="count">{count}</span>{/if}
  {#if state === 'on'}
    <svg class="mark" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  {:else if state === 'partial'}
    <svg class="mark" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6H10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  {/if}
</button>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background-color: transparent;
    color: var(--color-text-primary);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .chip:hover { border-color: var(--color-primary); }

  .chip.on,
  .chip.partial {
    border-color: var(--color-primary);
    background-color: var(--color-primary-light);
  }

  .chip.plain.on {
    background-color: var(--color-primary);
    color: var(--color-text-on-accent);
  }

  .dot {
    inline-size: 12px;
    block-size: 12px;
    border-radius: var(--border-radius-full);
    background-color: var(--race-unknown-ring);
  }

  .dot-cv { background-color: var(--race-cv-ring); }
  .dot-tc { background-color: var(--race-tc-ring); }
  .dot-cw { background-color: var(--race-cw-ring); }
  .dot-3nc { background-color: var(--race-3nc-ring); }
  .dot-ec { background-color: var(--race-ec-ring); }
  .dot-wc { background-color: var(--race-wc-ring); }

  .count {
    padding-inline: var(--spacing-xs);
    border-radius: var(--border-radius-full);
    background-color: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .mark { color: var(--color-primary-hover); }
  .chip.plain.on .mark { color: inherit; }
</style>
