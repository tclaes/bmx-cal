<script lang="ts">
  import { updateStore } from '@shared/stores/pwa.store';

  async function reload() {
    updateStore.confirmUpdate();

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });

          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          }, { once: true });
        } else {
          await registration.update();
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  }

  function dismiss() {
    if (!$updateStore.forceUpdate) {
      updateStore.dismiss();
    }
  }
</script>

{#if $updateStore.available}
  <div class="update-banner" class:force={$updateStore.forceUpdate} role="alert" aria-live="assertive">
    <span class="update-text">
      {#if $updateStore.forceUpdate}
        Critical update required. Please update to continue using the app.
      {:else}
        A new version is available.
      {/if}
    </span>
    <button class="update-btn" on:click={reload}>
      {$updateStore.forceUpdate ? 'Update Now' : 'Reload'}
    </button>
    {#if !$updateStore.forceUpdate}
      <button class="dismiss-btn" aria-label="Dismiss" on:click={dismiss}>
        &times;
      </button>
    {/if}
  </div>
{/if}

<style>
  .update-banner {
    position: fixed;
    bottom: var(--spacing-lg);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-sm) var(--spacing-md);
    white-space: nowrap;
    animation: slideUp 0.2s ease;
  }

  .update-banner.force {
    background-color: #fee;
    border-color: #fcc;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
  }

  .update-banner.force .update-text {
    color: #991b1b;
    font-weight: var(--font-weight-medium);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .update-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .update-btn {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: white;
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
      transform: none;
      white-space: normal;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  }
</style>
