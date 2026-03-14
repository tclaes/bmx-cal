<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let title = '';

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="presentation"
    on:click={handleBackdropClick}
    on:keydown={(e) => { if (e.key === 'Escape') close(); }}
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">{title}</h2>
        <button class="close-button" on:click={close}>×</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-index-modal);
    padding: var(--spacing-md);
  }

  .modal-content {
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-xl);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .modal-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .close-button {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-3xl);
    color: var(--color-text-secondary);
    transition: background-color var(--transition-base);
    line-height: 1;
  }

  .close-button:hover {
    background-color: var(--color-bg-secondary);
  }

  .modal-body {
    padding: var(--spacing-lg);
  }
</style>
