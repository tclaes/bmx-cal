<script lang="ts">
  export let type: 'text' | 'email' | 'password' | 'date' | 'time' = 'text';
  export let value = '';
  export let placeholder = '';
  export let label = '';
  export let error = '';
  export let disabled = false;
  export let required = false;
  export let id = '';
</script>

<div class="input-wrapper">
  {#if label}
    <label for={id} class="label">{label}</label>
  {/if}
  <input
    type={type}
    {id}
    {placeholder}
    {disabled}
    {required}
    class="input"
    class:error={!!error}
    value={value}
    on:input={(e) => { value = e.currentTarget.value; }}
    on:change
    on:blur
  />
  {#if error}
    <span class="error-message">{error}</span>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    transition: border-color var(--transition-base);
  }

  .input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .input:disabled {
    background-color: var(--color-bg-secondary);
    cursor: not-allowed;
  }

  .input.error {
    border-color: var(--color-danger);
  }

  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
  }
</style>
