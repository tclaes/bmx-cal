<script lang="ts">
  import { onMount } from 'svelte';
  import { currentRoute, startRouter, navigate } from './router';
  import { authStore, updateStore } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import Navigation from '@shared/components/Navigation.svelte';
  import UpdatePrompt from '@shared/components/UpdatePrompt.svelte';
  import InstallPrompt from '@shared/components/InstallPrompt.svelte';
  import CalendarView from '@features/calendar/CalendarView.svelte';
  import AdminDashboard from '@features/admin/AdminDashboard.svelte';
  import Login from '@features/admin/Login.svelte';
  import MyEventsPage from './features/my-events/MyEventsPage.svelte';
  import MyEventsDemoPage from './features/my-events/MyEventsDemoPage.svelte';
  import RegisterPage from './features/auth/RegisterPage.svelte';
  import LoginPage from './features/auth/LoginPage.svelte';
  import ForgotPasswordPage from './features/auth/ForgotPasswordPage.svelte';
  import ResetPasswordPage from './features/auth/ResetPasswordPage.svelte';
  import ProfilePage from './features/profile/ProfilePage.svelte';
  import TeamManagerDashboard from './features/team-manager/TeamManagerDashboard.svelte';
  import BugReportPage from './features/bug-report/BugReportPage.svelte';
  import AboutPage from './features/about/AboutPage.svelte';
  import GetInTouchPage from './features/about/GetInTouchPage.svelte';
  import GuidePage from './features/guide/GuidePage.svelte';
  import FaqPage from './features/guide/FaqPage.svelte';
  import RaceDayPage from './features/guide/RaceDayPage.svelte';
  import TracksPage from './features/guide/TracksPage.svelte';
  import PrivacyPolicyPage from './features/legal/PrivacyPolicyPage.svelte';
  import TermsPage from './features/legal/TermsPage.svelte';
  import CookieConsent from '@shared/components/CookieConsent.svelte';
  import { APP_VERSION } from '@config/version';
  import { canAccessMyCalendar } from '@shared/utils/permissions';
  import { locale, t, interpolate } from './i18n';

  const routeMeta: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'BMX Calendar - BMX events, races and competitions in Belgium',
      description: 'Discover upcoming BMX races, cups and shows across Belgium. Browse the shared calendar by date, club or type, build a personal schedule and export it to your calendar app.',
    },
    '/my-events': {
      title: 'Create my BMX calendar - BMX Calendar',
      description: 'Build a personal BMX season calendar: pick your races, export to Apple, Google or Outlook, and never miss a registration deadline.',
    },
    '/about': {
      title: 'About - BMX Calendar',
      description: 'Learn about BMX Calendar, a community project for Belgian BMX events.',
    },
    '/guide': {
      title: 'BMX Racing Guide - BMX Calendar',
      description: 'A complete beginner guide to BMX racing in Belgium: event types, categories, registration, equipment, and useful links.',
    },
    '/faq': {
      title: 'BMX Racing FAQ - BMX Calendar',
      description: 'Frequently asked questions about BMX racing in Belgium: age requirements, costs, licensing, race format, and rankings.',
    },
    '/race-day': {
      title: 'Race Day Checklist - BMX Calendar',
      description: 'Everything you need for a BMX race day: preparation checklist, race format, nutrition tips, and weather advice.',
    },
    '/tracks': {
      title: 'BMX Tracks in Belgium - BMX Calendar',
      description: 'Discover BMX tracks across Belgium: locations, track features, and club information for over 15 circuits.',
    },
    '/get-in-touch': {
      title: 'Get in touch - BMX Calendar',
      description: 'Contact the BMX Calendar team for questions, feedback or partnerships.',
    },
    '/privacy-policy': {
      title: 'Privacy Policy - BMX Calendar',
      description: 'How BMX Calendar handles your personal data, cookies and advertising.',
    },
    '/terms': {
      title: 'Terms of Service - BMX Calendar',
      description: 'The terms and conditions for using BMX Calendar.',
    },
    '/report-bug': {
      title: 'Report a bug - BMX Calendar',
      description: 'Report an issue or suggest improvements for BMX Calendar.',
    },
  };

  function updateDocumentMeta(path: string) {
    const meta = routeMeta[path];
    if (!meta) return;
    document.title = meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', meta.description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', `https://bmxkalender.be${path === '/' ? '/' : path}`);
  }

  // Routes that are utility/auth screens with no publisher content.
  // AdSense must not serve ads on these pages.
  const NO_AD_ROUTES = new Set([
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/profile',
    '/my-events',
    '/team-manager',
    '/admin',
    '/admin/login',
  ]);

  $: suppressAds = NO_AD_ROUTES.has($currentRoute);

  function openCookieSettings() {
    window.dispatchEvent(new Event('open-cookie-settings'));
  }

  $: updateDocumentMeta($currentRoute);
  $: if (typeof document !== 'undefined') {
    document.documentElement.lang = $locale;
  }

  let loading = import.meta.env.MODE !== 'test';
  let updateCheckMessage = '';
  let showUpdateMessage = false;

  onMount(() => {
    console.log('[App] onMount started');
    try {
      locale.init();
      console.log('[App] locale initialized');
    } catch (e) {
      console.error('[App] locale initialization failed:', e);
    }

    try {
      startRouter();
      console.log('[App] router started');
    } catch (e) {
      console.error('[App] router starting failed:', e);
    }

    try {
      AuthService.onAuthStateChange((user) => {
        console.log('[App] auth state changed:', user);
        authStore.setUser(user);
      });
      console.log('[App] auth state change listener registered');
    } catch (e) {
      console.error('[App] auth state change listener registration failed:', e);
    }

    (async () => {
      try {
        console.log('[App] fetching current user...');
        const user = await AuthService.getCurrentUser();
        console.log('[App] fetched current user:', user);
        authStore.setUser(user);
      } catch (e) {
        console.error('[App] fetching current user failed:', e);
      } finally {
        console.log('[App] setting loading to false');
        loading = false;
      }
    })();
  });

  function handleLoginSuccess() {
    navigate('/admin');
  }

  $: isAuthenticated = $authStore.user !== null;
  $: isAdmin = $authStore.user?.role === 'admin';
  $: isTeamManager = isAdmin || ($authStore.user?.managedTeams?.length ?? 0) > 0;

  async function handleCheckForUpdates() {
    showUpdateMessage = false;

    try {
      const versionInfo = await updateStore.checkForUpdates();

      if (versionInfo.hasUpdate || $updateStore.available) {
        updateCheckMessage = $t.footer.updateAvailable;
      } else {
        updateCheckMessage = $t.footer.latestVersion;
      }
    } catch {
      updateCheckMessage = $t.footer.updateFailed;
    }

    showUpdateMessage = true;
    setTimeout(() => {
      showUpdateMessage = false;
    }, 5000);
  }
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
      {#if $currentRoute === '/'}
        <CalendarView />
      {:else if $currentRoute === '/my-events'}
        {#if canAccessMyCalendar($authStore.user)}
          <MyEventsPage />
        {:else}
          <MyEventsDemoPage />
        {/if}
      {:else if $currentRoute === '/login'}
        <LoginPage />
      {:else if $currentRoute === '/register'}
        <RegisterPage />
      {:else if $currentRoute === '/forgot-password'}
        <ForgotPasswordPage />
      {:else if $currentRoute === '/reset-password'}
        <ResetPasswordPage />
      {:else if $currentRoute === '/admin/login'}
        <Login on:loginSuccess={handleLoginSuccess} />
      {:else if $currentRoute === '/admin'}
        {#if isAuthenticated && isAdmin}
          <AdminDashboard />
        {:else}
          <Login on:loginSuccess={handleLoginSuccess} />
        {/if}
      {:else if $currentRoute === '/profile'}
        {#if isAuthenticated}
          <ProfilePage />
        {:else}
          <LoginPage />
        {/if}
      {:else if $currentRoute === '/team-manager'}
        {#if isAuthenticated && isTeamManager}
          <TeamManagerDashboard />
        {:else}
          <LoginPage />
        {/if}
      {:else if $currentRoute === '/report-bug'}
        <BugReportPage />
      {:else if $currentRoute === '/about'}
        <AboutPage />
      {:else if $currentRoute === '/guide'}
        <GuidePage />
      {:else if $currentRoute === '/faq'}
        <FaqPage />
      {:else if $currentRoute === '/race-day'}
        <RaceDayPage />
      {:else if $currentRoute === '/tracks'}
        <TracksPage />
      {:else if $currentRoute === '/get-in-touch'}
        <GetInTouchPage />
      {:else if $currentRoute === '/privacy-policy'}
        <PrivacyPolicyPage />
      {:else if $currentRoute === '/terms'}
        <TermsPage />
      {:else}
        <div class="not-found">
          <h1>{$t.notFound.title}</h1>
          <p>{$t.notFound.description}</p>
        </div>
      {/if}
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <span>{interpolate($t.footer.copyright, { year: new Date().getFullYear() })}</span>
        <button class="footer-link" on:click={() => navigate('/about')}>{$t.footer.about}</button>
        <button class="footer-link" on:click={() => navigate('/get-in-touch')}>{$t.footer.getInTouch}</button>
        <button class="footer-link" on:click={() => navigate('/report-bug')}>{$t.footer.reportBug}</button>
        <button class="footer-link" on:click={() => navigate('/privacy-policy')}>{$t.footer.privacy}</button>
        <button class="footer-link" on:click={() => navigate('/terms')}>{$t.footer.terms}</button>
        <button class="footer-link" on:click={openCookieSettings}>{$t.footer.cookieSettings}</button>
        <button
          class="footer-link footer-link--version"
          on:click={handleCheckForUpdates}
          disabled={$updateStore.checking}
          title={interpolate($t.profile.currentVersion, { version: APP_VERSION })}
        >
          {$updateStore.checking ? $t.common.checking : `v${APP_VERSION}`}
        </button>
        {#if showUpdateMessage}
          <span class="update-message">{updateCheckMessage}</span>
        {/if}
        <a
          class="footer-link footer-link--kofi"
          href="https://ko-fi.com/bmxcalendar"
          target="_blank"
          rel="noopener noreferrer"
        >{$t.footer.support}</a>
      </div>
    </footer>
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

  .footer {
    border-top: 1px solid var(--color-border);
    background-color: var(--color-bg-secondary);
    padding: var(--spacing-md) var(--spacing-lg);
    margin-top: auto;
  }

  .footer-inner {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .footer-link {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .footer-link:hover {
    color: var(--color-text-secondary);
  }

  .footer-link--kofi {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-primary);
    border-radius: var(--border-radius-full);
    padding: var(--spacing-xxs) var(--spacing-sm);
    transition: all var(--transition-base);
  }

  .footer-link--kofi:hover {
    background-color: var(--color-primary);
    color: white;
  }

  .footer-link--version {
    font-family: monospace;
    padding: var(--spacing-xxs) var(--spacing-xs);
    border-radius: var(--border-radius-sm);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    text-decoration: none;
    font-weight: var(--font-weight-normal);
    transition: all var(--transition-base);
  }

  .footer-link--version:hover {
    border-color: var(--color-primary);
    background-color: var(--color-primary-light);
  }

  .footer-link--version:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .update-message {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
    padding: var(--spacing-xxs) var(--spacing-sm);
    background-color: var(--color-primary-light);
    border-radius: var(--border-radius-sm);
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .main-content {
    flex: 1;
    min-height: calc(100vh - 60px);
  }

  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .not-found h1 {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
  }

  .not-found p {
    font-size: var(--font-size-lg);
  }
</style>
