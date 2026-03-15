<script lang="ts">
  import { authStore, selectedEventIds } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import { selectionService } from '@shared/services/selection.service';
  import { currentRoute, navigate } from '../../router';

  let menuOpen = false;

  function handleNav(e: MouseEvent, path: string) {
    e.preventDefault();
    menuOpen = false;
    navigate(path);
  }

  async function handleLogout(e: MouseEvent) {
    e.preventDefault();
    menuOpen = false;
    await AuthService.logout();
    authStore.logout();
    selectionService.clearLocalSelections();
    selectedEventIds.set(new Set());
    navigate('/');
  }

  $: user = $authStore.user;
  $: isAdmin = user?.role === 'admin';
  $: isTeamManager = isAdmin || (user?.managedTeams?.length ?? 0) > 0;
  $: route = $currentRoute;
</script>

<nav class="navigation" aria-label="Main navigation">
  <div class="nav-container">
    <a class="nav-brand" href="/" on:click={(e) => handleNav(e, '/')} aria-label="BMX Calendar home">
      <img src="/bmx-calendar.png" alt="BMX Calendar" />
    </a>

    <ul class="nav-links" role="list">
      <li>
        <a class="nav-link" class:active={route === '/'} href="/" on:click={(e) => handleNav(e, '/')}>
          Events
        </a>
      </li>
      <li>
        <a class="nav-link" class:active={route === '/my-events'} href="/my-events" on:click={(e) => handleNav(e, '/my-events')}>
          Create my calendar
        </a>
      </li>

      {#if user}
        {#if isAdmin}
          <li>
            <a class="nav-link" class:active={route === '/admin'} href="/admin" on:click={(e) => handleNav(e, '/admin')}>
              Admin
            </a>
          </li>
        {/if}
        {#if isTeamManager}
          <li>
            <a class="nav-link" class:active={route === '/team-manager'} href="/team-manager" on:click={(e) => handleNav(e, '/team-manager')}>
              Team Manager
            </a>
          </li>
        {/if}
        <li>
          <a class="nav-link" class:active={route === '/profile'} href="/profile" on:click={(e) => handleNav(e, '/profile')}>
            Profile
          </a>
        </li>
        <li>
          <a class="nav-link nav-link--signout" href="/" on:click={handleLogout}>
            Sign out
          </a>
        </li>
      {:else}
        <li>
          <a class="nav-link nav-link--signin" href="/login" on:click={(e) => handleNav(e, '/login')}>
            Sign in
          </a>
        </li>
      {/if}
    </ul>

    <button
      class="hamburger"
      aria-label="Toggle menu"
      aria-expanded={menuOpen}
      aria-controls="mobile-menu"
      on:click={() => (menuOpen = !menuOpen)}
    >
      <span class="hamburger-bar" class:open={menuOpen}></span>
      <span class="hamburger-bar" class:open={menuOpen}></span>
      <span class="hamburger-bar" class:open={menuOpen}></span>
    </button>
  </div>

  {#if menuOpen}
    <ul class="mobile-menu" id="mobile-menu" role="list">
      <li>
        <a class="mobile-link" class:active={route === '/'} href="/" on:click={(e) => handleNav(e, '/')}>
          Events
        </a>
      </li>
      <li>
        <a class="mobile-link" class:active={route === '/my-events'} href="/my-events" on:click={(e) => handleNav(e, '/my-events')}>
          Create my calendar
        </a>
      </li>

      {#if user}
        {#if isAdmin}
          <li>
            <a class="mobile-link" class:active={route === '/admin'} href="/admin" on:click={(e) => handleNav(e, '/admin')}>
              Admin
            </a>
          </li>
        {/if}
        {#if isTeamManager}
          <li>
            <a class="mobile-link" class:active={route === '/team-manager'} href="/team-manager" on:click={(e) => handleNav(e, '/team-manager')}>
              Team Manager
            </a>
          </li>
        {/if}
        <li>
          <a class="mobile-link" class:active={route === '/profile'} href="/profile" on:click={(e) => handleNav(e, '/profile')}>
            Profile
          </a>
        </li>
        <li>
          <a class="mobile-link mobile-link--signout" href="/" on:click={handleLogout}>
            Sign out
          </a>
        </li>
      {:else}
        <li>
          <a class="mobile-link mobile-link--signin" href="/login" on:click={(e) => handleNav(e, '/login')}>
            Sign in
          </a>
        </li>
      {/if}
    </ul>
  {/if}
</nav>

<style>
  .navigation {
    background-color: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-sm);
    overflow: visible;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-brand {
    overflow: hidden;
    width: 8rem;
    height: 5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-brand img {
    height: 9rem;
    width: auto;
    display: block;
    margin-top: 1rem;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-link {
    display: block;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    text-decoration: none;
  }

  .nav-link:hover,
  .nav-link.active {
    color: var(--color-primary);
    background-color: var(--color-bg-secondary);
  }

  .nav-link--signin {
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }

  .nav-link--signin:hover {
    background-color: var(--color-primary);
    color: white;
  }

  .nav-link--signout:hover {
    color: var(--color-error, #dc2626);
    background-color: var(--color-error-bg, #fef2f2);
  }

  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 36px;
    height: 36px;
    padding: 6px;
    cursor: pointer;
    border-radius: var(--border-radius-md);
    transition: background-color var(--transition-base);
  }

  .hamburger:hover {
    background-color: var(--color-bg-secondary);
  }

  .hamburger-bar {
    display: block;
    width: 100%;
    height: 2px;
    background-color: var(--color-text-primary);
    border-radius: 2px;
    transition: transform 0.2s ease, opacity 0.2s ease;
    transform-origin: center;
  }

  .hamburger-bar:nth-child(1).open {
    transform: translateY(7px) rotate(45deg);
  }

  .hamburger-bar:nth-child(2).open {
    opacity: 0;
    transform: scaleX(0);
  }

  .hamburger-bar:nth-child(3).open {
    transform: translateY(-7px) rotate(-45deg);
  }

  .mobile-menu {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
    border-top: 1px solid var(--color-border);
    background-color: var(--color-bg-primary);
    animation: slideDown 0.15s ease;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .mobile-link {
    display: block;
    padding: 0.75rem var(--spacing-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    text-decoration: none;
  }

  .mobile-link:hover,
  .mobile-link.active {
    color: var(--color-primary);
    background-color: var(--color-bg-secondary);
  }

  .mobile-link--signin {
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    margin-top: var(--spacing-sm);
    text-align: center;
  }

  .mobile-link--signin:hover {
    background-color: var(--color-primary);
    color: white;
  }

  .mobile-link--signout:hover {
    color: var(--color-error, #dc2626);
    background-color: var(--color-error-bg, #fef2f2);
  }

  @media (max-width: 767px) {
    .nav-links {
      display: none;
    }

    .hamburger {
      display: flex;
    }
  }

  @media (min-width: 768px) {
    .mobile-menu {
      display: none !important;
    }
  }
</style>
