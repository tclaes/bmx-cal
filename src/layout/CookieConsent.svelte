<script lang="ts">
  import { onMount } from 'svelte';
  import {
    loadConsent,
    hasDecided,
    acceptAll,
    rejectAll,
    applyConsentToGoogle,
  } from './cookie-consent';
  import { watchAdConsent } from './ad-consent';
  import { navigate } from '../router';

  let visible = false;

  onMount(() => {
    applyConsentToGoogle(loadConsent());

    // Google's certified CMP asks for advertising consent first; only show our
    // analytics banner once that choice is made, so the two never overlap.
    const stopWatching = watchAdConsent(() => {
      if (!hasDecided(loadConsent())) visible = true;
    });

    const handler = () => {
      visible = true;
    };
    window.addEventListener('open-cookie-settings', handler);
    return () => {
      stopWatching();
      window.removeEventListener('open-cookie-settings', handler);
    };
  });

  function onAccept() {
    acceptAll();
    visible = false;
  }

  function onReject() {
    rejectAll();
    visible = false;
  }

  function openPrivacy(e: MouseEvent) {
    e.preventDefault();
    visible = false;
    navigate('/privacy-policy');
  }
</script>

{#if visible}
  <div
    class="cookie-banner"
    role="dialog"
    aria-live="polite"
    aria-labelledby="cookie-title"
    aria-describedby="cookie-desc"
  >
    <div class="banner-inner">
      <div class="banner-text">
        <h2 id="cookie-title">Analytics cookies</h2>
        <p id="cookie-desc">
          We use essential cookies to make the site work. With your consent
          we also use Google Analytics to measure traffic. Advertising choices
          are made in Google's separate consent window. You can change both at
          any time from the footer. See our
          <a href="/privacy-policy" on:click={openPrivacy}>Privacy Policy</a>.
        </p>
      </div>
      <div class="banner-actions">
        <button type="button" class="btn btn--ghost" on:click={onReject}>
          Reject analytics
        </button>
        <button type="button" class="btn btn--primary" on:click={onAccept}>
          Accept analytics
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .cookie-banner {
    position: fixed;
    inset-block-end: 0;
    inset-inline: 0;
    background-color: var(--color-bg-primary);
    border-block-start: 1px solid var(--color-border);
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
    padding-block: var(--spacing-md);
    padding-inline: var(--spacing-lg);
    z-index: 9999;
    animation: slideUp 0.25s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .banner-inner {
    max-width: 1200px;
    margin-inline: auto;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .banner-text h2 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--spacing-xs);
    color: var(--color-text-primary);
  }

  .banner-text p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }

  .banner-text a {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .banner-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  .btn {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    padding-block: var(--spacing-sm);
    padding-inline: var(--spacing-md);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast), border-color var(--transition-fast);
    white-space: nowrap;
  }

  .btn--primary {
    background-color: var(--color-primary);
    color: white;
    border: 1px solid var(--color-primary);
  }

  .btn--primary:hover {
    background-color: var(--color-primary-dark, #1d4ed8);
  }

  .btn--ghost {
    background-color: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }

  .btn--ghost:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }

  @media (max-width: 720px) {
    .banner-inner {
      grid-template-columns: 1fr;
    }

    .banner-actions {
      flex-direction: column-reverse;
    }

    .btn {
      inline-size: 100%;
    }
  }
</style>
