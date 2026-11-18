<script lang="ts">
  import { createEventDispatcher, onDestroy, tick } from 'svelte';
  import { selectedEventIds, selectedCount, clearAllSelections, selectEventsByType, deselectEventsByType } from '@core/stores';
  import Button from '@ui/Button.svelte';
  import { navigate } from '../../router';
  import { t, interpolate } from '../../i18n';

  export let isLoggedIn: boolean;
  export let exporting = false;

  // `error` carries a message to show, or '' to clear a previous one after a successful action.
  const dispatch = createEventDispatcher<{ export: void; save: void; error: string }>();

  // Clearing is undoable for a few seconds instead of asking for confirmation.
  const UNDO_MS = 6000;
  let clearedIds: string[] = [];
  let undoVisible = false;
  let undoButton: HTMLButtonElement | undefined;
  let clearButton: HTMLButtonElement | undefined;
  let undoTimer: ReturnType<typeof setTimeout> | undefined;
  // Lets an undo that is still writing tell whether a newer clear happened, and whether it
  // succeeded: only a successful newer clear cancels the undo.
  let clearsStarted = 0;
  let clearsSucceeded = 0;
  let latestClear: Promise<unknown> = Promise.resolve();

  async function newerClearSucceeded(started: number, succeeded: number): Promise<boolean> {
    // Store writes run in order, so once the latest clear settles every earlier one has too.
    // Keep waiting while more clears start, so a later clear is never overtaken by the restore.
    let seen = started;
    while (clearsStarted !== seen) {
      seen = clearsStarted;
      await latestClear;
    }
    return clearsSucceeded !== succeeded;
  }

  function hideUndo() {
    clearTimeout(undoTimer);
    undoVisible = false;
    clearedIds = [];
  }

  /** Offers undo for `ids` for UNDO_MS and moves keyboard focus to it. */
  async function showUndo(ids: string[]) {
    clearedIds = ids;
    undoVisible = true;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(hideUndo, UNDO_MS);
    await tick();
    undoButton?.focus();
  }

  async function handleClearAll() {
    const ids = Array.from($selectedEventIds);
    clearsStarted += 1;
    const clearing = clearAllSelections();
    latestClear = clearing.catch(() => undefined);
    try {
      await clearing;
    } catch {
      dispatch('error', $t.myEvents.clearFailed);
      return;
    }
    clearsSucceeded += 1;
    dispatch('error', '');
    // The clear button is gone now; keep keyboard focus on the way back
    await showUndo(ids);
  }

  async function handleUndo() {
    const cleared = clearedIds;
    const wanted = new Set(cleared);
    const started = clearsStarted;
    const succeeded = clearsSucceeded;
    hideUndo();
    // Restore exactly the cleared selection, also when races were picked in the meantime.
    // A failed removal does not stop the cleared races from coming back.
    const current = $selectedEventIds;
    const toRemove = Array.from(current).filter(id => !wanted.has(id));
    const toAdd = Array.from(wanted).filter(id => !current.has(id));
    let failed = false;
    if (toRemove.length > 0) {
      try { await deselectEventsByType(toRemove); } catch { failed = true; }
    }
    // The user cleared again while the removal was pending: a successful newer clear wins.
    if (await newerClearSucceeded(started, succeeded)) return;
    if (toAdd.length > 0) {
      try { await selectEventsByType(toAdd); } catch { failed = true; }
    }
    if (await newerClearSucceeded(started, succeeded)) return;

    if (failed) {
      // Keep the way back open: offer the same undo again so the user can retry.
      dispatch('error', $t.myEvents.restoreFailed);
      await showUndo(cleared);
      return;
    }
    dispatch('error', '');
    // The undo button is gone now; keep keyboard focus on the clear control that came back
    await tick();
    clearButton?.focus();
  }

  onDestroy(() => clearTimeout(undoTimer));
</script>

{#if $selectedCount > 0}
  <div class="selection">
    <div class="top">
      <span class="count">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
        {interpolate($t.myEvents.selected, { count: $selectedCount })}
      </span>
      <button type="button" class="clear" bind:this={clearButton} on:click={handleClearAll}>{$t.myEvents.clearSelection}</button>
    </div>

    {#if isLoggedIn}
      <div class="actions">
        <div class="act act-export">
          <Button fullWidth on:click={() => dispatch('export')} disabled={exporting}>
            {exporting ? $t.myEvents.exporting : $t.myEvents.exportToCalendar}
          </Button>
        </div>
        <div class="act act-save">
          <Button variant="ghost" fullWidth on:click={() => dispatch('save')}>
            {$t.myEvents.saveCalendar}
          </Button>
        </div>
      </div>
    {:else}
      <div class="actions account">
        <p class="reason">{$t.myEvents.accountReason}</p>
        <div class="act">
          <Button fullWidth on:click={() => navigate('/register')}>{$t.myEvents.createAccountToExport}</Button>
        </div>
        <a class="signin" href="/login" on:click|preventDefault={() => navigate('/login')}>{$t.nav.signIn}</a>
      </div>
    {/if}
  </div>
{/if}

{#if undoVisible}
  <div class="undo" role="status">
    <span>{clearedIds.length === 1 ? $t.myEvents.selectionClearedOne : interpolate($t.myEvents.selectionCleared, { count: clearedIds.length })}</span>
    <button type="button" class="undo-btn" bind:this={undoButton} on:click={handleUndo}>{$t.myEvents.undo}</button>
  </div>
{/if}

<style>
  /* One card on every width: count row on top, actions below, same padding on all sides */
  .selection {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-block-end: var(--spacing-lg);
    padding: var(--spacing-md);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-md);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }

  .count {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .count svg {
    color: var(--color-accent);
  }

  .clear,
  .signin {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .clear:hover,
  .signin:hover {
    color: var(--color-text-primary);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-sm-plus);
  }

  .actions.account {
    justify-items: stretch;
  }

  .reason {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .signin {
    justify-self: center;
  }

  /* In the flow, where the selection bar was, so it is never hidden behind a banner */
  .undo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    margin-block-end: var(--spacing-lg);
    min-block-size: calc(var(--touch-target-min) + var(--spacing-sm));
    padding: 0 var(--spacing-xs) 0 var(--spacing-md);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
  }

  .undo-btn {
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-md);
    color: var(--color-primary-hover);
    font-weight: var(--font-weight-semibold);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  @media (min-width: 768px) {
    /* Equal columns: both actions are as wide as the wider one */
    .actions {
      grid-template-columns: repeat(2, 1fr);
      inline-size: max-content;
      max-inline-size: 100%;
      align-items: center;
    }

    .act-save {
      order: -1;
    }

    .actions.account {
      grid-template-columns: 1fr auto auto;
    }
  }
</style>
