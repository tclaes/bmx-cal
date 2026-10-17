<script lang="ts">
  export let value = '';
  export let label = '';
  export let error = '';
  export let disabled = false;
  export let required = false;
  export let id = '';
  export let options: Array<{ value: string; label: string }> = [];
  export let placeholder = 'Select an option';
</script>

<div class="select-wrapper">
  {#if label}
    <label for={id} class="label">{label}</label>
  {/if}
  <select
    {id}
    {disabled}
    {required}
    class="select"
    class:error={!!error}
    bind:value
    on:change
  >
    <option value="" disabled selected>{placeholder}</option>
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  {#if error}
    <span class="error-message">{error}</span>
  {/if}
</div>

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .select {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    transition: border-color var(--transition-base);
    cursor: pointer;
  }

  .select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .select:disabled {
    background-color: var(--color-bg-secondary);
    cursor: not-allowed;
  }

  .select.error {
    border-color: var(--color-danger);
  }

  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
  }
</style>
