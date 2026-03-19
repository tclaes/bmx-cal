<script lang="ts">
  import { onMount } from 'svelte';
  import { currentRoute, startRouter, navigate } from './router';
  import { authStore } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import Navigation from '@shared/components/Navigation.svelte';
  import UpdatePrompt from '@shared/components/UpdatePrompt.svelte';
  import InstallPrompt from '@shared/components/InstallPrompt.svelte';
  import CalendarView from '@features/calendar/CalendarView.svelte';
  import AdminDashboard from '@features/admin/AdminDashboard.svelte';
  import Login from '@features/admin/Login.svelte';
  import MyEventsPage from './features/my-events/MyEventsPage.svelte';
  import RegisterPage from './features/auth/RegisterPage.svelte';
  import LoginPage from './features/auth/LoginPage.svelte';
  import ForgotPasswordPage from './features/auth/ForgotPasswordPage.svelte';
  import ResetPasswordPage from './features/auth/ResetPasswordPage.svelte';
  import ProfilePage from './features/profile/ProfilePage.svelte';
  import TeamManagerDashboard from './features/team-manager/TeamManagerDashboard.svelte';
  import BugReportPage from './features/bug-report/BugReportPage.svelte';
  import AboutPage from './features/about/AboutPage.svelte';
  import GetInTouchPage from './features/about/GetInTouchPage.svelte';

  let loading = true;

  onMount(() => {
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

  function handleLoginSuccess() {
    navigate('/admin');
  }

  $: isAuthenticated = $authStore.user !== null;
  $: isAdmin = $authStore.user?.role === 'admin';
  $: isTeamManager = isAdmin || ($authStore.user?.managedTeams?.length ?? 0) > 0;
</script>

<UpdatePrompt />
<InstallPrompt />

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
        <MyEventsPage />
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
      {:else if $currentRoute === '/get-in-touch'}
        <GetInTouchPage />
      {:else}
        <div class="not-found">
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
        </div>
      {/if}
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <span>&copy; {new Date().getFullYear()} BMX Calendar. All rights reserved.</span>
        <button class="footer-link" on:click={() => navigate('/about')}>About</button>
        <button class="footer-link" on:click={() => navigate('/get-in-touch')}>Get in touch</button>
        <button class="footer-link" on:click={() => navigate('/report-bug')}>Report a bug</button>
        <a
          class="footer-link footer-link--kofi"
          href="https://ko-fi.com/bmxcalendar"
          target="_blank"
          rel="noopener noreferrer"
        >Support this project</a>
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
    padding: 8px;
    text-decoration: none;
    z-index: 10000;
    border-radius: 0 0 4px 0;
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
    padding: 2px var(--spacing-sm);
    transition: all var(--transition-base);
  }

  .footer-link--kofi:hover {
    background-color: var(--color-primary);
    color: white;
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
