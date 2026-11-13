<script lang="ts">
  import { authStore, selectedEventIds } from '@core/stores';
  import { AuthService } from '@core/services';
  import { selectionService } from '@core/services';
  import { currentRoute, navigate } from '../router';
  import { locale, t } from '../i18n';
  import type { Locale } from '../i18n';
  import Logo from '@ui/Logo.svelte';

  let menuOpen = false;
  let navEl: HTMLElement;

  const locales: Locale[] = ['en', 'nl', 'fr'];

  function closeMenu() {
    menuOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  }

  function handleResize() {
    if (window.innerWidth >= 1024 && menuOpen) closeMenu();
  }

  function handleOutsideClick(e: MouseEvent) {
    if (menuOpen && navEl && !navEl.contains(e.target as Node)) closeMenu();
  }

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

  function setLocale(l: Locale) {
    locale.setLocale(l);
  }

  $: user = $authStore.user;
  $: isAdmin = user?.role === 'admin';
  $: isTeamManager = isAdmin || (user?.managedTeams?.length ?? 0) > 0;
  $: route = $currentRoute;
  $: currentLocale = $locale;
</script>

<svelte:window on:keydown={handleKeydown} on:resize={handleResize} />

<nav class="navigation" aria-label="Main navigation" bind:this={navEl} on:click={handleOutsideClick}>
  <div class="nav-container">
    <a class="nav-brand" href="/" on:click={(e) => handleNav(e, '/')} aria-label={$t.nav.home}>
      <Logo size={48} />
    </a>

    <ul class="nav-links" role="list">
      <li>
        <a class="nav-link" class:active={route === '/' || route.startsWith('/events/')} href="/" on:click={(e) => handleNav(e, '/')}>
          {$t.nav.events}
        </a>
      </li>
      <li>
        <a class="nav-link" class:active={route === '/my-events'} href="/my-events" on:click={(e) => handleNav(e, '/my-events')}>
          {$t.nav.myCalendar}
        </a>
      </li>
      <li>
        <a class="nav-link" class:active={route === '/news'} href="/news" on:click={(e) => handleNav(e, '/news')}>
          {$t.nav.news}
        </a>
      </li>

      {#if user}
        {#if isAdmin}
          <li>
            <a class="nav-link" class:active={route === '/admin'} href="/admin" on:click={(e) => handleNav(e, '/admin')}>
              {$t.nav.admin}
            </a>
          </li>
        {/if}
        {#if isTeamManager}
          <li>
            <a class="nav-link" class:active={route === '/team-manager'} href="/team-manager" on:click={(e) => handleNav(e, '/team-manager')}>
              {$t.nav.teamManager}
            </a>
          </li>
        {/if}
        <li>
          <a class="nav-link" class:active={route === '/profile'} href="/profile" on:click={(e) => handleNav(e, '/profile')}>
            {$t.nav.profile}
          </a>
        </li>
        <li>
          <a class="nav-link nav-link--signout" href="/" on:click={handleLogout}>
            {$t.nav.signOut}
          </a>
        </li>
      {:else}
        <li>
          <a class="nav-link nav-link--signin" href="/login" on:click={(e) => handleNav(e, '/login')}>
            {$t.nav.signIn}
          </a>
        </li>
      {/if}

      <li class="locale-switcher" aria-label="Language switcher">
        {#each locales as l}
          <button
            class="locale-btn"
            class:active={currentLocale === l}
            on:click={() => setLocale(l)}
            aria-pressed={currentLocale === l}
            aria-label={l.toUpperCase()}
          >
            {l.toUpperCase()}
          </button>
        {/each}
      </li>
    </ul>

    <button
      class="hamburger"
      aria-label={$t.nav.toggleMenu}
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
        <a class="mobile-link" class:active={route === '/' || route.startsWith('/events/')} href="/" on:click={(e) => handleNav(e, '/')}>
          {$t.nav.events}
        </a>
      </li>
      <li>
        <a class="mobile-link" class:active={route === '/my-events'} href="/my-events" on:click={(e) => handleNav(e, '/my-events')}>
          {$t.nav.myCalendar}
        </a>
      </li>
      <li>
        <a class="mobile-link" class:active={route === '/news'} href="/news" on:click={(e) => handleNav(e, '/news')}>
          {$t.nav.news}
        </a>
      </li>

      {#if user}
        {#if isAdmin}
          <li>
            <a class="mobile-link" class:active={route === '/admin'} href="/admin" on:click={(e) => handleNav(e, '/admin')}>
              {$t.nav.admin}
            </a>
          </li>
        {/if}
        {#if isTeamManager}
          <li>
            <a class="mobile-link" class:active={route === '/team-manager'} href="/team-manager" on:click={(e) => handleNav(e, '/team-manager')}>
              {$t.nav.teamManager}
            </a>
          </li>
        {/if}
        <li>
          <a class="mobile-link" class:active={route === '/profile'} href="/profile" on:click={(e) => handleNav(e, '/profile')}>
            {$t.nav.profile}
          </a>
        </li>
        <li>
          <a class="mobile-link mobile-link--signout" href="/" on:click={handleLogout}>
            {$t.nav.signOut}
          </a>
        </li>
      {:else}
        <li>
          <a class="mobile-link mobile-link--signin" href="/login" on:click={(e) => handleNav(e, '/login')}>
            {$t.nav.signIn}
          </a>
        </li>
      {/if}

      <li class="mobile-locale-switcher" aria-label="Language switcher">
        {#each locales as l}
          <button
            class="locale-btn"
            class:active={currentLocale === l}
            on:click={() => setLocale(l)}
            aria-pressed={currentLocale === l}
            aria-label={l.toUpperCase()}
          >
            {l.toUpperCase()}
          </button>
        {/each}
      </li>
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
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-md) var(--spacing-md) 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .nav-brand {
    padding: var(--spacing-sm) 0 var(--spacing-sm);
  }

  .nav-links {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-md);
    list-style: none;
    margin: 0;
    padding: 0 0 var(--spacing-sm);
  }

  .nav-link {
    display: block;
    padding: var(--spacing-sm) var(--spacing-md);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.02em;
    white-space: nowrap;
    color: var(--color-text-secondary);
    transition: all var(--transition-base);
    text-decoration: none;
    text-transform: uppercase;
    border-radius: 0;
    border-block-end: 3px solid transparent;
  }

  .nav-link:hover {
    color: var(--color-text-primary);
  }

  .nav-link.active {
    color: var(--color-text-primary);
    border-block-end-color: var(--color-accent);
  }

  .nav-link--signin {
    color: var(--color-text-primary);
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-md);
  }

  .nav-link--signin:hover {
    border-color: var(--color-primary);
    color: var(--color-primary-hover);
  }

  .nav-link--signout:hover {
    color: var(--color-danger);
    background-color: var(--color-danger-light);
  }

  .locale-switcher {
    display: flex;
    align-items: center;
    align-self: center;
    margin-inline-start: var(--spacing-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    gap: 0;
    padding: 0;
  }

  .locale-btn {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    padding: var(--spacing-xxs) var(--spacing-xs);
    border-radius: 0;
    cursor: pointer;
    transition: all var(--transition-base);
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--touch-target-min);
    min-block-size: var(--touch-target-min);
    text-align: center;
  }

  /* Compact size for the desktop nav only; the mobile menu keeps the full touch target. */
  .locale-switcher .locale-btn {
    min-inline-size: 2rem;
    min-block-size: 2rem;
  }

  .locale-btn:hover {
    color: var(--color-text-primary);
    background-color: var(--color-bg-secondary);
  }

  .locale-btn.active {
    color: var(--color-text-on-accent);
    background-color: var(--color-primary);
    font-weight: var(--font-weight-bold);
  }

  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: var(--spacing-xs);
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    padding: var(--spacing-sm);
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
    animation: slide-down 0.15s ease;
  }

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mobile-link {
    display: block;
    padding: var(--spacing-sm-plus) var(--spacing-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    text-decoration: none;
  }

  .mobile-link:hover,
  .mobile-link.active {
    color: var(--color-primary);
    background-color: var(--color-primary-light);
  }

  .mobile-link--signin {
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    margin-top: var(--spacing-sm);
    text-align: center;
  }

  .mobile-link--signin:hover {
    background-color: var(--color-primary);
    color: var(--color-text-on-accent);
  }

  .mobile-link--signout:hover {
    color: var(--color-danger);
    background-color: var(--color-danger-light);
  }

  .mobile-locale-switcher {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) var(--spacing-sm) var(--spacing-sm);
    border-top: 1px solid var(--color-border);
    margin-top: var(--spacing-sm);
  }

  @media (max-width: 1023px) {
    .nav-container {
      align-items: center;
    }

    .nav-links {
      display: none;
    }

    .hamburger {
      display: flex;
    }
  }

  @media (min-width: 1024px) {
    .mobile-menu {
      display: none !important;
    }
  }
</style>
