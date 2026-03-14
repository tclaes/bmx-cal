<script lang="ts">
  import { authStore } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import { navigate } from '../../router';

  function handleNavigate(path: string) {
    navigate(path);
  }

  async function handleLogout() {
    await AuthService.logout();
    authStore.logout();
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
  </div>
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

  @media (max-width: 767px) {
    .nav-container {
      justify-content: center;
    }

    .nav-links {
      display: none;
    }
  }

  @media (min-width: 768px) {
    .brand-text {
      display: inline;
    }
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
</style>
