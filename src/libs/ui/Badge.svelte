<script lang="ts">
  export let color = 'var(--badge-default-bg)';
  export let label = '';
  export let variant: 'default' | 'success' | 'warning' | 'error' | undefined = undefined;

  const variantColors: Record<NonNullable<typeof variant>, string> = {
    default: 'var(--badge-default-bg)',
    success: 'var(--badge-success-bg)',
    warning: 'var(--badge-warning-bg)',
    error: 'var(--badge-error-bg)',
  };

  $: effectiveColor = variant ? variantColors[variant] : color;
</script>

<span class="badge" style="background-color: {effectiveColor}; color: var(--badge-fg);">
  {label}
</span>

<style>
  .badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    border-radius: var(--border-radius-full);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
