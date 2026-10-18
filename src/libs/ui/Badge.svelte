<script lang="ts">
  export let color = '#3b82f6';
  export let label = '';
  export let variant: 'default' | 'success' | 'warning' | 'error' | undefined = undefined;

  const variantColors: Record<NonNullable<typeof variant>, string> = {
    default: '#3b82f6',
    success: '#15803d',
    warning: '#b45309',
    error: '#b91c1c',
  };

  $: effectiveColor = variant ? variantColors[variant] : color;
</script>

<span class="badge" style="background-color: {effectiveColor}; color: #ffffff;">
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
