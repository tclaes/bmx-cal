<script lang="ts">
  import { updateStore } from '@core/stores';
  import { t } from '../i18n';

  let updating = false;

  async function reload() {
    updating = true;
    await updateStore.applyUpdate();
  }
</script>

{#if $updateStore.state === 'optional'}
  <!-- Non-modal dialog: announced to assistive tech, but the app stays usable. -->
  <dialog open class="update-banner" aria-labelledby="update-banner-text">
    <span id="update-banner-text" class="update-text">{$t.pwa.newVersion}</span>
    <button class="update-btn" on:click={reload} disabled={updating}>
      {$t.pwa.reload}
    </button>
    <button class="dismiss-btn" aria-label={$t.pwa.dismiss} on:click={() => updateStore.dismiss()}>
      &times;
    </button>
  </dialog>
{/if}

<style>
  .update-banner {
    position: fixed;
    inset: auto;
    top: var(--spacing-md);
    left: 50%;
    margin: 0;
    color: var(--color-text-primary);
    transform: translateX(-50%);
    z-index: var(--z-index-toast);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-sm) var(--spacing-md);
    white-space: nowrap;
    animation: slide-down 0.2s ease;
  }

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-12px);
    }

    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .update-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .update-btn {
    min-height: var(--touch-target-min);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-on-accent);
    background-color: var(--color-primary);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-xs) var(--spacing-sm);
    cursor: pointer;
    transition: opacity var(--transition-base);
  }

  .update-btn:hover {
    opacity: 0.85;
  }

  .dismiss-btn {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
    font-size: 1.1rem;
    line-height: 1;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--spacing-xxs) var(--spacing-xs);
    border-radius: var(--border-radius-sm);
    transition: color var(--transition-base);
  }

  .dismiss-btn:hover {
    color: var(--color-text-primary);
  }

  @media (max-width: 767px) {
    .update-banner {
      top: var(--spacing-sm);
      left: var(--spacing-md);
      right: var(--spacing-md);
      width: auto;
      transform: none;
      white-space: normal;
    }

    @keyframes slide-down {
      from {
        opacity: 0;
        transform: translateY(-12px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
</style>
