<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let label = 'Loading...';
</script>

<div class="spinner spinner-{size}" role="status" aria-live="polite">
  <span class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;">{label}</span>
</div>

<style>
  .spinner {
    position: relative;
    border-radius: var(--border-radius-full);
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    animation: spin 0.8s linear infinite;
  }

  .spinner-sm {
    width: 20px;
    height: 20px;
  }

  .spinner-md {
    width: 40px;
    height: 40px;
  }

  .spinner-lg {
    width: 60px;
    height: 60px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
