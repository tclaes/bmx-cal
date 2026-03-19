<script lang="ts">
  import { getAccessibleTextColor } from '../utils/color-contrast';

  export let color = '#3b82f6';
  export let label = '';

  $: textColor = getAccessibleTextColor(color);
</script>

<span class="badge" style="background-color: {color}; color: {textColor};">
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
