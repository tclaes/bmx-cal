<script lang="ts">
  import { updateStore } from '@core/stores';
  import { t, locale } from '../i18n';

  let dialog: HTMLDialogElement;
  let updating = false;

  $: required = $updateStore.state === 'mandatory';
  $: message = $updateStore.message?.[$locale] ?? null;

  // showModal() puts the notice in the top layer (above every z-index) and makes the rest
  // of the page inert, so the app cannot be used while an update is required.
  $: if (dialog) syncOpen(required);

  function syncOpen(open: boolean) {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }

  // Escape must not dismiss a mandatory update.
  function preventCancel(event: Event) {
    event.preventDefault();
  }

  // Some browsers close a modal dialog on a repeated Escape even when cancel is prevented.
  function reopenIfRequired() {
    if (required) dialog.showModal();
  }

  async function update() {
    updating = true;
    await updateStore.applyUpdate();
  }
</script>

<dialog
  bind:this={dialog}
  class="update-required"
  role="alertdialog"
  aria-labelledby="update-required-title"
  aria-describedby="update-required-body"
  on:cancel={preventCancel}
  on:close={reopenIfRequired}
>
  <!-- Always rendered (a closed dialog is hidden), so showModal() can focus the button. -->
  <div class="update-required__panel">
    <h2 id="update-required-title" class="update-required__title">{$t.pwa.updateRequiredTitle}</h2>
    <p id="update-required-body" class="update-required__body">{message ?? $t.pwa.updateRequiredBody}</p>
    <button class="update-required__button" on:click={update} disabled={updating}>
      {$t.pwa.updateNow}
    </button>
  </div>
</dialog>

<style>
  /* Fills the viewport so nothing of the app shows behind it. */
  .update-required {
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    margin: 0;
    border: none;
    color: var(--color-text-primary);
  }

  .update-required[open] {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    background-color: var(--color-bg-primary);
  }

  .update-required__panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    width: 100%;
    max-width: 420px;
    padding: var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-top: 3px solid var(--color-accent);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-xl);
    text-align: center;
  }

  .update-required__title {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  .update-required__body {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    overflow-wrap: anywhere;
  }

  .update-required__button {
    min-height: var(--touch-target-min);
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-on-accent);
    background-color: var(--color-primary);
    border-radius: var(--border-radius-md);
    cursor: pointer;
  }

  .update-required__button:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  .update-required__button:disabled {
    cursor: progress;
  }
</style>
