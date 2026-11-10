<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string;
  export let id: string;
  export let selectedCount = 0;
  export let open = false;
  export let placeholder = 'Select options';

  const dispatch = createEventDispatcher<{
    toggle: void;
  }>();

  function handleToggle(event: Event) {
    event.stopPropagation();
    dispatch('toggle');
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (open && !target.closest(`#dropdown-${id}`)) {
      dispatch('toggle');
    }
  }

  $: displayText = selectedCount === 0 ? placeholder : `${selectedCount} selected`;
</script>

<svelte:window on:click={handleClickOutside} />

<div id="dropdown-{id}" class="dropdown">
  <label class="dropdown-label" for="{id}-btn">{label}</label>
  <button
    id="{id}-btn"
    class="dropdown-button"
    on:click={handleToggle}
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open}
  >
    <span class="dropdown-text">{displayText}</span>
    <span class="dropdown-arrow">{open ? '▲' : '▼'}</span>
  </button>

  {#if open}
    <div class="dropdown-menu">
      <slot />
    </div>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .dropdown-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .dropdown-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    cursor: pointer;
    text-align: start;
  }

  .dropdown-button:hover {
    border-color: var(--color-primary);
  }

  .dropdown-text {
    flex: 1;
  }

  .dropdown-arrow {
    margin-inline-start: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .dropdown-menu {
    position: absolute;
    inset-block-start: 100%;
    inset-inline-start: 0;
    inset-inline-end: 0;
    margin-block-start: var(--spacing-xs);
    padding: var(--spacing-xs);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
  }
</style>
