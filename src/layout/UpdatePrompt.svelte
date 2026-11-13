<script lang="ts">
  import { updateStore } from '@core/stores';
  import { t } from '../i18n';

  let updating = false;
  let announcement = '';

  $: visible = $updateStore.state === 'optional';
  $: announce(visible);

  // Screen readers do not reliably announce a region that is inserted together with its text,
  // so use ariaNotify() where available and otherwise a live region that is always in the page.
  function announce(show: boolean) {
    if (!show) {
      announcement = '';
      return;
    }
    const text = `${$t.pwa.newVersion} ${$t.pwa.actionsAvailable}`;
    const doc = document as Document & { ariaNotify?: (message: string) => void };
    if (typeof doc.ariaNotify === 'function') {
      doc.ariaNotify(text);
      return;
    }
    announcement = text;
  }

  async function reload() {
    updating = true;
    await updateStore.applyUpdate();
  }
</script>

<div class="visually-hidden" aria-live="polite">{announcement}</div>

{#if visible}
  <!-- Non-modal dialog: the app stays usable. Announced via the live region above. -->
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
  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .update-banner {
    position: fixed;
    inset: auto;
    bottom: var(--spacing-lg);
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
    animation: slide-up 0.2s ease;
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(12px);
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
      bottom: var(--spacing-md);
      left: var(--spacing-md);
      right: var(--spacing-md);
      width: auto;
      transform: none;
      white-space: normal;
    }

    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(12px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
</style>
