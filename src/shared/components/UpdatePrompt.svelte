<script lang="ts">
  import { updateAvailable } from '@shared/stores/pwa.store';

  function reload() {
    window.location.reload();
  }
</script>

{#if $updateAvailable}
  <div class="update-banner" role="alert" aria-live="polite">
    <span class="update-text">A new version is available.</span>
    <button class="update-btn" on:click={reload}>Reload</button>
    <button class="dismiss-btn" aria-label="Dismiss" on:click={() => updateAvailable.set(false)}>
      &times;
    </button>
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
    padding: 4px var(--spacing-sm);
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
    padding: 2px 4px;
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
