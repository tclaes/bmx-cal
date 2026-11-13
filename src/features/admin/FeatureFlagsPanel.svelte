<script lang="ts">
  import { featureFlagsStore } from '@core/stores';
  import { Alert } from '@ui';
  import { formatDateTime, toUserMessage } from '@shared/utils';

  // Plain-language descriptions for the known flags; unknown keys show the key only.
  const descriptions: Record<string, string> = {
    notifications: 'Deadline notifications block on My calendar (not finished yet).',
  };

  let error = '';
  let busyKey: string | null = null;

  $: flags = Object.values($featureFlagsStore.flags).sort((a, b) => a.key.localeCompare(b.key));

  async function toggle(key: string, enabled: boolean) {
    busyKey = key;
    error = '';
    try {
      await featureFlagsStore.setEnabled(key, enabled);
    } catch (err) {
      error = toUserMessage(err, 'Could not change the flag');
    } finally {
      busyKey = null;
    }
  }
</script>

<div class="flags">
  <p class="hint">Changes reach visitors the next time they load the app.</p>

  {#if error}
    <Alert type="danger" message={error} />
  {/if}

  {#if !$featureFlagsStore.loaded}
    <p class="empty">Loading…</p>
  {:else if $featureFlagsStore.error}
    <Alert type="danger" message="Could not read the feature flags ({$featureFlagsStore.error}). Has the feature_flags migration been applied?" />
  {:else if flags.length === 0}
    <p class="empty">No feature flags found.</p>
  {:else}
    <ul class="list">
      {#each flags as flag (flag.key)}
        <li class="item">
          <div class="info">
            <span class="key">{flag.key}</span>
            {#if descriptions[flag.key]}<span class="desc">{descriptions[flag.key]}</span>{/if}
            <span class="meta">Last changed {formatDateTime(flag.updated_at)}</span>
          </div>
          <button
            type="button"
            class="switch"
            class:on={flag.enabled}
            role="switch"
            aria-checked={flag.enabled}
            aria-label={flag.key}
            disabled={busyKey === flag.key}
            on:click={() => toggle(flag.key, !flag.enabled)}
          >
            <span class="knob" aria-hidden="true"></span>
            <span class="state">{flag.enabled ? 'On' : 'Off'}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .flags {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding-block-start: var(--spacing-md);
  }

  .hint,
  .empty {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background-color: var(--color-bg-secondary);
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
    min-inline-size: 0;
  }

  .key {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  .desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .switch {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-full);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    flex-shrink: 0;
  }

  .switch:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  .knob {
    inline-size: 14px;
    block-size: 14px;
    border-radius: var(--border-radius-full);
    background-color: var(--color-text-muted);
  }

  .switch.on {
    border-color: var(--color-success);
    color: var(--color-success);
  }

  .switch.on .knob {
    background-color: var(--color-success);
  }
</style>
