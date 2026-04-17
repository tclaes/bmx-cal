<script lang="ts">
  import { onMount } from 'svelte';
  import { installPromptStore } from '@shared/stores';
  import Button from './Button.svelte';
  import { t } from '../../i18n';

  let showPrompt = false;
  let deferredPrompt: any = null;
  let dismissed = false;

  onMount(() => {
    const hasSeenPrompt = localStorage.getItem('pwa-install-dismissed');
    if (hasSeenPrompt) {
      dismissed = true;
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (!isStandalone && !isIOS && !dismissed) {
        setTimeout(() => {
          showPrompt = true;
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      installPromptStore.setInstalled(true);
    }

    window.addEventListener('appinstalled', () => {
      showPrompt = false;
      installPromptStore.setInstalled(true);
      deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  });

  async function handleInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      showPrompt = false;
      installPromptStore.setInstalled(true);
    }

    deferredPrompt = null;
  }

  function handleDismiss() {
    showPrompt = false;
    dismissed = true;
    localStorage.setItem('pwa-install-dismissed', 'true');
  }
</script>

{#if showPrompt}
  <div class="install-prompt-overlay" on:click={handleDismiss} on:keydown={(e) => e.key === 'Escape' && handleDismiss()} role="presentation">
    <div class="install-prompt" role="dialog" aria-labelledby="install-title">
      <button class="close-button" on:click={handleDismiss} aria-label={$t.pwa.close} type="button">
        &times;
      </button>

      <div class="prompt-content">
        <div class="app-icon">
          <img src="/bmx-calendar-transparent.png" alt="BMX Calendar" />
        </div>

        <h3 id="install-title">{$t.pwa.installTitle}</h3>
        <p>{$t.pwa.installDescription}</p>

        <div class="prompt-actions">
          <Button variant="primary" on:click={handleInstall}>
            {$t.pwa.install}
          </Button>
          <Button variant="secondary" on:click={handleDismiss}>
            {$t.pwa.notNow}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .install-prompt-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .install-prompt {
    position: relative;
    width: 100%;
    max-width: 500px;
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease-out;
    margin: 0 var(--spacing-md) 0 var(--spacing-md);
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .close-button {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 28px;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
  }

  .close-button:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .prompt-content {
    padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--spacing-md);
  }

  .app-icon {
    width: 80px;
    height: 80px;
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .app-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  p {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .prompt-actions {
    display: flex;
    gap: var(--spacing-sm);
    width: 100%;
    margin-top: var(--spacing-sm);
  }

  .prompt-actions :global(button) {
    flex: 1;
  }

  @media (min-width: 769px) {
    .install-prompt-overlay {
      align-items: center;
    }

    .install-prompt {
      border-radius: var(--border-radius-lg);
      margin: var(--spacing-md);
    }
  }

  @media (max-width: 768px) {
    .install-prompt {
      max-width: 100%;
      margin: 0;
    }
  }
</style>
