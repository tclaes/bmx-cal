<script lang="ts">
  export let padding: 'sm' | 'md' | 'lg' = 'md';
  export let shadow: 'sm' | 'md' | 'lg' = 'md';
</script>

<div class="card card-padding-{padding} card-shadow-{shadow}">
  <slot />
</div>

<style>
  .card {
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--color-border);
  }

  .card-padding-sm {
    padding: var(--spacing-md);
  }

  .card-padding-md {
    padding: var(--spacing-lg);
  }

  .card-padding-lg {
    padding: var(--spacing-xl);
  }

  .card-shadow-sm {
    box-shadow: var(--shadow-sm);
  }

  .card-shadow-md {
    box-shadow: var(--shadow-md);
  }

  .card-shadow-lg {
    box-shadow: var(--shadow-lg);
  }
</style>
