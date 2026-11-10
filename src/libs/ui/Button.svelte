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
    min-block-size: var(--touch-target-min);
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.04em;
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    cursor: pointer;
    border: 1px solid transparent;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
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
    background-color: var(--color-accent);
    color: var(--color-text-on-accent);
  }

  .button-primary:hover:not(:disabled) {
    background-color: var(--color-accent-hover);
  }

  .button-secondary {
    background-color: var(--color-primary);
    color: var(--color-text-on-accent);
  }

  .button-secondary:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  .button-danger {
    background-color: var(--color-danger);
    color: var(--color-text-on-accent);
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
