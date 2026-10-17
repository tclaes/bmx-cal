<script lang="ts">
  import { onMount } from 'svelte';
  import { startRouter } from './router';
  import RouteOutlet from './router/RouteOutlet.svelte';
  import { authStore } from '@core/stores';
  import { AuthService } from '@core/services';
  import Navigation from '@shared/components/Navigation.svelte';
  import Footer from '@shared/components/Footer.svelte';
  import UpdatePrompt from '@shared/components/UpdatePrompt.svelte';
  import InstallPrompt from '@shared/components/InstallPrompt.svelte';
  import CookieConsent from '@shared/components/CookieConsent.svelte';
  import { locale } from './i18n';

  $: if (typeof document !== 'undefined') {
    document.documentElement.lang = $locale;
  }

  let loading = import.meta.env.MODE !== 'test';

  onMount(() => {
    try {
      locale.init();
    } catch (e) {
      console.error('Locale initialization failed:', e);
    }

    try {
      startRouter();
    } catch (e) {
      console.error('Router starting failed:', e);
    }

    try {
      AuthService.onAuthStateChange((user) => {
        authStore.setUser(user);
      });
    } catch (e) {
      console.error('Auth state change listener registration failed:', e);
    }

    (async () => {
      try {
        const user = await AuthService.getCurrentUser();
        authStore.setUser(user);
      } catch (e) {
        console.error('Fetching current user failed:', e);
      } finally {
        loading = false;
      }
    })();
  });
</script>

<UpdatePrompt />
<InstallPrompt />
<CookieConsent />

<div class="app">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header>
    <Navigation />
  </header>

  <main id="main-content" class="main-content">
    <RouteOutlet />
  </main>

  <Footer />
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-primary);
  }

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

  .main-content {
    flex: 1;
    min-height: calc(100vh - 60px);
  }
</style>
