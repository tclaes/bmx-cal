<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';

  export let open = false;
  export let title = '';

  const dispatch = createEventDispatcher();

  let modalContent: HTMLDivElement;
  let previousActiveElement: HTMLElement | null = null;
  let focusableElements: HTMLElement[] = [];
  let firstFocusable: HTMLElement | null = null;
  let lastFocusable: HTMLElement | null = null;

  function close() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function getFocusableElements(): HTMLElement[] {
    if (!modalContent) return [];

    const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(modalContent.querySelectorAll(selector));
  }

  function trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  async function setupFocusTrap() {
    await tick();

    previousActiveElement = document.activeElement as HTMLElement;

    focusableElements = getFocusableElements();
    firstFocusable = focusableElements[0] || null;
    lastFocusable = focusableElements[focusableElements.length - 1] || null;

    if (firstFocusable) {
      firstFocusable.focus();
    } else if (modalContent) {
      modalContent.focus();
    }
  }

  function restoreFocus() {
    if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  }

  $: if (open) {
    setupFocusTrap();
  } else {
    restoreFocus();
  }
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="presentation"
    on:click={handleBackdropClick}
  >
    <div
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
      bind:this={modalContent}
      on:keydown={(e) => { if (e.key === 'Escape') close(); }}
      on:keydown={trapFocus}
    >
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">{title}</h2>
        <button class="close-button" on:click={close} aria-label="Close modal" type="button">×</button>
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
    min-width: 44px;
    min-height: 44px;
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

  .close-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .modal-body {
    padding: var(--spacing-lg);
  }
</style>
