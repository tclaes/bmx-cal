<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let fullWidth = false;
</script>

<button
  {type}
  {disabled}
  class="button button-{variant} button-{size}"
  class:full-width={fullWidth}
  on:click
>
  <slot />
</button>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-weight: var(--font-weight-medium);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    cursor: pointer;
    border: 1px solid transparent;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-sm {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--font-size-sm);
  }

  .button-md {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--font-size-base);
  }

  .button-lg {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
  }

  .button-primary {
    background-color: var(--color-primary);
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  .button-secondary {
    background-color: var(--color-secondary);
    color: white;
  }

  .button-secondary:hover:not(:disabled) {
    background-color: var(--color-secondary-hover);
  }

  .button-danger {
    background-color: var(--color-danger);
    color: white;
  }

  .button-danger:hover:not(:disabled) {
    background-color: var(--color-danger-hover);
  }

  .button-ghost {
    background-color: transparent;
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }

  .button-ghost:hover:not(:disabled) {
    background-color: var(--color-bg-secondary);
  }

  .full-width {
    width: 100%;
  }
</style>
