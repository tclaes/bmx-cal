<script lang="ts">
  export let color = 'var(--color-info)';
  export let label = '';
  export let variant: 'default' | 'success' | 'warning' | 'error' | undefined = undefined;

  const variantColors: Record<NonNullable<typeof variant>, string> = {
    default: 'var(--color-info)',
    success: 'var(--color-success-strong)',
    warning: 'var(--color-warning-strong)',
    error: 'var(--color-danger-strong)',
  };

  $: effectiveColor = variant ? variantColors[variant] : color;
</script>

<span class="badge" style="background-color: {effectiveColor}; color: var(--color-on-color);">
  {label}
</span>

<style>
  .badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    border-radius: var(--border-radius-full);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
