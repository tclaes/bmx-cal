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

  $: isAdminRoute = $currentRoute === '/admin';
  $: requiresAuth = isAdminRoute;
  $: isAuthenticated = $authStore.user !== null;
  $: isAdmin = $authStore.user?.role === 'admin';
</script>

<div class="app">
  {#if !loading}
    <Navigation />

    <main class="main-content">
      {#if $currentRoute === '/'}
        <CalendarView />
      {:else if $currentRoute === '/my-events'}
        <MyEventsPage />
      {:else if $currentRoute === '/admin/login'}
        <Login on:loginSuccess={handleLoginSuccess} />
      {:else if $currentRoute === '/admin'}
        {#if isAuthenticated && isAdmin}
          <AdminDashboard />
        {:else}
          <Login on:loginSuccess={handleLoginSuccess} />
        {/if}
      {:else}
        <div class="not-found">
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
        </div>
      {/if}
    </main>
  {/if}
</div>

<style>
  .app {
    min-height: 100vh;
    background-color: var(--color-bg-primary);
  }

  .main-content {
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
