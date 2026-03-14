<script lang="ts">
  import { onMount } from 'svelte';
  import { currentRoute, startRouter, navigate } from './router';
  import { authStore } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import Navigation from '@shared/components/Navigation.svelte';
  import CalendarView from '@features/calendar/CalendarView.svelte';
  import AdminDashboard from '@features/admin/AdminDashboard.svelte';
  import Login from '@features/admin/Login.svelte';
  import MyEventsPage from './features/my-events/MyEventsPage.svelte';
  import RegisterPage from './features/auth/RegisterPage.svelte';
  import LoginPage from './features/auth/LoginPage.svelte';
  import ProfilePage from './features/profile/ProfilePage.svelte';
  import TeamManagerDashboard from './features/team-manager/TeamManagerDashboard.svelte';

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

<div class="app">
  {#if !loading}
    <Navigation />

    <main class="main-content">
      {#if $currentRoute === '/'}
        <CalendarView />
      {:else if $currentRoute === '/my-events'}
        <MyEventsPage />
      {:else if $currentRoute === '/login'}
        <LoginPage />
      {:else if $currentRoute === '/register'}
        <RegisterPage />
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
      </div>
    </footer>
  {/if}
</div>

<style>
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
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
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
