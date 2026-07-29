<script lang="ts">
  import { onMount } from 'svelte';
  import { currentRoute, startRouter } from './router';
  import { authStore } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import Navigation from '@shared/components/Navigation.svelte';
  import UpdatePrompt from '@shared/components/UpdatePrompt.svelte';
  import InstallPrompt from '@shared/components/InstallPrompt.svelte';
  import CookieConsent from '@shared/components/CookieConsent.svelte';
  import Footer from '@shared/components/Footer.svelte';
  import RouterView from '@shared/components/RouterView.svelte';
  import { NO_AD_ROUTES, updateDocumentMeta } from '@shared/utils/route-meta';
  import { locale } from './i18n';

  $: suppressAds = NO_AD_ROUTES.has($currentRoute);
  $: updateDocumentMeta($currentRoute);
  $: if (typeof document !== 'undefined') {
    document.documentElement.lang = $locale;
  }

  let loading = true;

  onMount(() => {
    locale.init();
    startRouter();

    AuthService.onAuthStateChange((user) => {
      authStore.setUser(user);
    });

    (async () => {
      const user = await AuthService.getCurrentUser();
      authStore.setUser(user);
      loading = false;
    })();
  });
</script>

<svelte:head>
  {#if suppressAds}
    <!-- Tell AdSense not to serve ads on utility/auth screens that have no publisher content -->
    <meta name="google" content="noad" />
  {/if}
</svelte:head>

<UpdatePrompt />
<InstallPrompt />
<CookieConsent />

<div class="app">
  {#if !loading}
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <header>
      <Navigation />
    </header>

    <main id="main-content" class="main-content">
      <RouterView />
    </main>

    <Footer />
  {/if}
</div>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-sm);
    text-decoration: none;
    z-index: 10000;
    border-radius: 0 0 var(--border-radius-sm) 0;
  }

  .skip-link:focus {
    top: 0;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-primary);
  }

  .main-content {
    flex: 1;
    min-height: calc(100vh - 60px);
  }
</style>
