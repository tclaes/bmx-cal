<script lang="ts">
  export let type: 'success' | 'warning' | 'danger' | 'info' = 'info';
  export let message = '';
  export let dismissible = false;
  export let onDismiss: (() => void) | undefined = undefined;
</script>

{#if message}
  <div class="alert alert-{type}">
    <span class="alert-message">{message}</span>
    {#if dismissible && onDismiss}
      <button class="dismiss-button" on:click={onDismiss}>×</button>
    {/if}
  </div>
{/if}

<style>
  .alert {
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .alert-success {
    background-color: var(--color-success-light);
    color: var(--color-success);
    border: 1px solid var(--color-success);
  }

  .alert-warning {
    background-color: var(--color-warning-light);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
  }

  .alert-danger {
    background-color: var(--color-danger-light);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }

  .alert-info {
    background-color: var(--color-primary-light);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }

  .alert-message {
    flex: 1;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  .dismiss-button {
    width: 24px;
    height: 24px;
    border-radius: var(--border-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-2xl);
    transition: background-color var(--transition-base);
    line-height: 1;
    opacity: 0.7;
  }

  .dismiss-button:hover {
    opacity: 1;
  }
</style>
