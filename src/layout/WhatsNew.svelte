<script lang="ts">
  import { onMount } from 'svelte';
  import { Modal } from '@ui';
  import { APP_VERSION, RELEASE_NOTES } from '@config';
  import { shouldShowReleaseNotes } from '@shared/utils';
  import { t, locale, interpolate } from '../i18n';

  const LAST_SEEN_KEY = 'last_seen_version';
  // Key used by the previous version checker; read once so users upgrading from it see the notes.
  const LEGACY_KEY = 'app_version';

  let open = false;

  // The locale is initialised in AppLayout's onMount, which runs after this component's,
  // so only the text follows the locale; whether to open depends on any notes existing.
  $: notes = RELEASE_NOTES[$locale] ?? RELEASE_NOTES.en ?? RELEASE_NOTES.nl ?? RELEASE_NOTES.fr;
  const anyNotes = RELEASE_NOTES.en ?? RELEASE_NOTES.nl ?? RELEASE_NOTES.fr;

  function read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  onMount(() => {
    const lastSeen = read(LAST_SEEN_KEY) ?? read(LEGACY_KEY);
    open = shouldShowReleaseNotes(lastSeen, APP_VERSION, anyNotes);
    try {
      localStorage.setItem(LAST_SEEN_KEY, APP_VERSION);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Storage unavailable: notes may show again next time, which is harmless.
    }
  });
</script>

<Modal {open} title={$t.pwa.whatsNewTitle} on:close={() => (open = false)}>
  <p class="whats-new__version">{interpolate($t.pwa.whatsNewVersion, { version: APP_VERSION })}</p>
  <p class="whats-new__notes">{notes}</p>
</Modal>

<style>
  .whats-new__version {
    margin: 0 0 var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .whats-new__notes {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    white-space: pre-line;
  }
</style>
