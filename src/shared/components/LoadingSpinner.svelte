<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<div class="spinner spinner-{size}"></div>

<style>
  .spinner {
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
</style>
