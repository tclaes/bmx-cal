<script lang="ts">
  import { authStore, selectedEventIds } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import { selectionService } from '@shared/services/selection.service';
  import { navigate } from '../../router';

  let menuOpen = false;

  function handleNavigate(path: string) {
    menuOpen = false;
    navigate(path);
  }

  async function handleLogout() {
    menuOpen = false;
    await AuthService.logout();
    authStore.logout();
    selectionService.clearLocalSelections();
    selectedEventIds.set(new Set());
    navigate('/');
  }

  $: user = $authStore.user;
  $: isAdmin = user?.role === 'admin';
</script>

<nav class="navigation">
  <div class="nav-container">
    <button class="nav-brand" on:click={() => handleNavigate('/')}>
      <span class="brand-icon">
        <img src="/bmx-calendar.png" alt="BMX Calendar Logo" />
      </span>
      <span class="brand-text">BMX Calendar</span>
    </button>

    <div class="nav-links">
      <button class="nav-link" on:click={() => handleNavigate('/')}>
        Events
      </button>
      <button class="nav-link" on:click={() => handleNavigate('/my-events')}>
        Create my calendar
      </button>

      {#if user}
        <div class="user-menu">
          <span class="user-email">{user.email}</span>
          {#if isAdmin}
            <button class="nav-link" on:click={() => handleNavigate('/admin')}>
              Admin
            </button>
          {/if}
          <button class="nav-link nav-link--signout" on:click={handleLogout}>
            Sign out
          </button>
        </div>
      {:else}
        <button class="nav-link nav-link--signin" on:click={() => handleNavigate('/login')}>
          Sign in
        </button>
      {/if}
    </div>

    <button
      class="hamburger"
      aria-label="Toggle menu"
      aria-expanded={menuOpen}
      on:click={() => (menuOpen = !menuOpen)}
    >
      <span class="hamburger-bar" class:open={menuOpen}></span>
      <span class="hamburger-bar" class:open={menuOpen}></span>
      <span class="hamburger-bar" class:open={menuOpen}></span>
    </button>
  </div>

  {#if menuOpen}
    <div class="mobile-menu">
      <button class="mobile-link" on:click={() => handleNavigate('/')}>
        Events
      </button>
      <button class="mobile-link" on:click={() => handleNavigate('/my-events')}>
        Create my calendar
      </button>

      {#if user}
        <div class="mobile-user-email">{user.email}</div>
        {#if isAdmin}
          <button class="mobile-link" on:click={() => handleNavigate('/admin')}>
            Admin
          </button>
        {/if}
        <button class="mobile-link mobile-link--signout" on:click={handleLogout}>
          Sign out
        </button>
      {:else}
        <button class="mobile-link mobile-link--signin" on:click={() => handleNavigate('/login')}>
          Sign in
        </button>
      {/if}
    </div>
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
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .brand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-icon img {
    height: 8rem;
    width: auto;
  }

  .brand-text {
    display: none;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .nav-link {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    cursor: pointer;
  }

  .nav-link:hover {
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

  .user-menu {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .user-email {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    display: none;
    flex-direction: column;
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
    text-align: left;
    padding: 0.75rem var(--spacing-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    cursor: pointer;
    width: 100%;
  }

  .mobile-link:hover {
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

  .mobile-user-email {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    padding: 0.5rem var(--spacing-sm);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 767px) {
    .nav-container {
      justify-content: space-between;
    }

    .nav-links {
      display: none;
    }

    .hamburger {
      display: flex;
    }

    .mobile-menu {
      display: flex;
    }
  }

  @media (min-width: 768px) {
    .brand-text {
      display: inline;
    }

    .mobile-menu {
      display: none !important;
    }
  }
</style>
