<script lang="ts">
  import { updateStore } from '@shared/stores';
  import { APP_VERSION } from '@config/version';
  import { t, interpolate } from '../../i18n';
  import { navigate } from '../../router';
  import { onMount, onDestroy } from 'svelte';

  const footerRoutes = [
    { path: '/about', key: 'about' as const },
    { path: '/get-in-touch', key: 'getInTouch' as const },
    { path: '/report-bug', key: 'reportBug' as const },
    { path: '/privacy-policy', key: 'privacy' as const },
    { path: '/terms', key: 'terms' as const },
  ];

  let updateCheckMessage = '';
  let showUpdateMessage = false;
  let updateTimeout: ReturnType<typeof setTimeout> | null = null;

  function openCookieSettings() {
    window.dispatchEvent(new Event('open-cookie-settings'));
  }

  function clearUpdateTimeout() {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
  }

  async function handleCheckForUpdates() {
    clearUpdateTimeout();
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
    updateTimeout = setTimeout(() => {
      showUpdateMessage = false;
      updateTimeout = null;
    }, 5000);
  }

  onDestroy(() => {
    clearUpdateTimeout();
  });
</script>

<footer class="footer">
  <div class="footer-inner">
    <span>{interpolate($t.footer.copyright, { year: new Date().getFullYear() })}</span>
    {#each footerRoutes as route}
      <button class="footer-link" on:click={() => navigate(route.path)}>{$t.footer[route.key]}</button>
    {/each}
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

<style>
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
</style>
