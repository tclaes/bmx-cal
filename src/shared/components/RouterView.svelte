<script lang="ts">
  import { authStore } from '@shared/stores';
  import { currentRoute, navigate } from '../../router';
  import { canAccessMyCalendar } from '@shared/utils/permissions';
  import { t } from '../../i18n';
  import CalendarView from '@features/calendar/CalendarView.svelte';
  import AdminDashboard from '@features/admin/AdminDashboard.svelte';
  import Login from '@features/admin/Login.svelte';
  import MyEventsPage from '@features/my-events/MyEventsPage.svelte';
  import MyEventsDemoPage from '@features/my-events/MyEventsDemoPage.svelte';
  import RegisterPage from '@features/auth/RegisterPage.svelte';
  import LoginPage from '@features/auth/LoginPage.svelte';
  import ForgotPasswordPage from '@features/auth/ForgotPasswordPage.svelte';
  import ResetPasswordPage from '@features/auth/ResetPasswordPage.svelte';
  import ProfilePage from '@features/profile/ProfilePage.svelte';
  import TeamManagerDashboard from '@features/team-manager/TeamManagerDashboard.svelte';
  import BugReportPage from '@features/bug-report/BugReportPage.svelte';
  import AboutPage from '@features/about/AboutPage.svelte';
  import GetInTouchPage from '@features/about/GetInTouchPage.svelte';
  import GuidePage from '@features/guide/GuidePage.svelte';
  import FaqPage from '@features/guide/FaqPage.svelte';
  import RaceDayPage from '@features/guide/RaceDayPage.svelte';
  import TracksPage from '@features/guide/TracksPage.svelte';
  import PrivacyPolicyPage from '@features/legal/PrivacyPolicyPage.svelte';
  import TermsPage from '@features/legal/TermsPage.svelte';

  $: isAuthenticated = $authStore.user !== null;
  $: isAdmin = $authStore.user?.role === 'admin';
  $: isTeamManager = isAdmin || ($authStore.user?.managedTeams?.length ?? 0) > 0;

  function handleLoginSuccess() {
    navigate('/admin');
  }
</script>

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

<style>
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
