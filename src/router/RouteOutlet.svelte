<script lang="ts">
  import { currentRoute } from './index';
  import { findRoute, isAccessGranted, shouldSuppressAds } from './routes';
  import type { RouteDefinition } from './routes';
  import { authStore } from '@core/stores';
  import NotFoundPage from './NotFoundPage.svelte';

  const SITE_URL = 'https://bmxkalender.be';

  let matched: RouteDefinition | undefined;
  let resolved: RouteDefinition['component'] | undefined;

  $: matched = findRoute($currentRoute);
  $: resolved =
    matched && isAccessGranted(matched.access, $authStore.user)
      ? matched.component
      : (matched?.fallback ?? undefined);
  $: updateDocumentMeta($currentRoute, matched);
  $: suppressAds = shouldSuppressAds($currentRoute);

  function updateDocumentMeta(path: string, route: RouteDefinition | undefined) {
    if (!route?.meta) return;
    document.title = route.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', route.meta.description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', `${SITE_URL}${path === '/' ? '/' : path}`);
  }
</script>

<svelte:head>
  {#if suppressAds}
    <!-- Tell AdSense not to serve ads on utility/auth screens that have no publisher content -->
    <meta name="google" content="noad" />
  {/if}
</svelte:head>

{#key $currentRoute}
  {#if resolved}
    <svelte:component this={resolved} />
  {:else}
    <NotFoundPage />
  {/if}
{/key}
