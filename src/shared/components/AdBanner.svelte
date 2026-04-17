<script lang="ts">
  import { onMount } from 'svelte';

  export let slot: string = '';
  export let format: 'auto' | 'rectangle' | 'vertical' = 'auto';
  export let fullWidthResponsive: boolean = true;

  const CLIENT = 'ca-pub-4950654000854684';

  onMount(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // AdSense not loaded
    }
  });
</script>

<div class="ad-banner" aria-label="Advertisement" role="complementary">
  <span class="ad-label">Advertisement</span>
  <ins
    class="adsbygoogle"
    style="display:block"
    data-ad-client={CLIENT}
    data-ad-slot={slot}
    data-ad-format={format}
    data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
  ></ins>
</div>

<style>
  .ad-banner {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .ad-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    align-self: flex-start;
  }

  .adsbygoogle {
    width: 100%;
  }
</style>
