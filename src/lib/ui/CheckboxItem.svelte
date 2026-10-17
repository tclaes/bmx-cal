<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string;
  export let checked = false;
  export let value: string;

  const dispatch = createEventDispatcher<{
    change: string;
  }>();

  function handleChange() {
    dispatch('change', value);
  }
</script>

<label class="checkbox-item">
  <input
    type="checkbox"
    {checked}
    on:change={handleChange}
  />
  <span class="checkbox-label">{label}</span>
</label>

<style>
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-sm);
    transition: background-color var(--transition-base);
    cursor: pointer;
  }

  .checkbox-item:hover {
    background-color: var(--color-bg-secondary);
  }

  .checkbox-item input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  .checkbox-label {
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    user-select: none;
  }
</style>
