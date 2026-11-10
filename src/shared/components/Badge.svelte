<script lang="ts">
  import { darkenColorForWhiteText } from '../utils/color-contrast';

  export let color = '#3b82f6';
  export let label = '';

  $: adjustedBgColor = darkenColorForWhiteText(color);
</script>

<!-- Text stays pure white: the background is darkened by darkenColorForWhiteText for contrast (see color-contrast.ts). -->
<span class="badge" style="background-color: {adjustedBgColor}; color: #ffffff;">
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
