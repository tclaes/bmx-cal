<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { selectedEventIds, loadUserSelections, toggleEventSelection, clearAllSelections, selectedCount, selectEventsByType, deselectEventsByType } from '@core/stores';
  import { EventsService } from '@core/services';
  import { generateICalContent, downloadICalFile, getRaceView } from '@shared/utils';
  import Button from '@ui/Button.svelte';
  import { RaceRow, TypeChip } from '@ui';
  import { navigate } from '../../router';
  import LoadingSpinner from '@ui/LoadingSpinner.svelte';
  import { authStore, featureEnabled } from '@core/stores';

  import { PushService } from '@core/services';
  import SaveCalendarModal from './SaveCalendarModal.svelte';
  import SavedCalendarsList from './SavedCalendarsList.svelte';
  import type { EventWithDetails, EventType } from '../../types';
  import { supabase } from '@data';
  import { t, interpolate } from '../../i18n';

  let events: EventWithDetails[] = [];
  let loading = true;
  let error = '';
  let exporting = false;
  let showSaveModal = false;
  let savedCalendarsRefresh = 0;
  let pushSupported = false;
  let pushEnabled = false;
  let enablingPush = false;
  let sendingTestPush = false;


  $: isLoggedIn = !!$authStore.user;

  $: sortedEvents = [...events]
    .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  $: eventTypes = (() => {
    const map = new Map<string, { type: EventType; ids: string[] }>();
    for (const event of events) {
      if (event.event_type) {
        const key = event.event_type.id;
        if (!map.has(key)) {
          map.set(key, { type: event.event_type, ids: [] });
        }
        map.get(key)!.ids.push(event.id);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.type.name.localeCompare(b.type.name));
  })();

  function isTypeFullySelected(ids: string[], selected: Set<string>): boolean {
    return ids.length > 0 && ids.every(id => selected.has(id));
  }

  function isTypePartiallySelected(ids: string[], selected: Set<string>): boolean {
    return ids.some(id => selected.has(id)) && !isTypeFullySelected(ids, selected);
  }

  async function handleTypeToggle(ids: string[]) {
    if (isTypeFullySelected(ids, $selectedEventIds)) {
      await deselectEventsByType(ids);
    } else {
      await selectEventsByType(ids);
    }
  }

  // The notification block is behind the `notifications` flag. The flag may load after
  // this page mounts, so the push check runs once, as soon as the block is allowed.
  const notificationsFlag = featureEnabled('notifications');
  let pushChecked = false;

  $: showNotifications = $notificationsFlag && isLoggedIn;
  $: if (showNotifications && !pushChecked) {
    pushChecked = true;
    checkPush();
  }

  async function checkPush() {
    try {
      pushSupported = PushService.isSupported();
      pushEnabled = pushSupported && await PushService.isSubscribed();
    } catch {
      pushEnabled = false;
    }
  }

  onMount(async () => {
    try {
      events = await EventsService.getAllEvents();
      await loadUserSelections();
    } catch (e) {
      error = e instanceof Error ? e.message : $t.myEvents.failedToLoad;
    } finally {
      loading = false;
    }
  });

  function openDetail(e: MouseEvent, href: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  }

  async function handleToggle(eventId: string) {
    try {
      await toggleEventSelection(eventId);
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update selection';
    }
  }

  // Clearing is undoable for a few seconds instead of asking for confirmation.
  const UNDO_MS = 6000;
  let clearedIds: string[] = [];
  let undoVisible = false;
  let undoTimer: ReturnType<typeof setTimeout> | undefined;

  function hideUndo() {
    clearTimeout(undoTimer);
    undoVisible = false;
    clearedIds = [];
  }

  async function handleClearAll() {
    const ids = Array.from($selectedEventIds);
    try {
      await clearAllSelections();
      error = '';
      clearedIds = ids;
      undoVisible = true;
      clearTimeout(undoTimer);
      undoTimer = setTimeout(hideUndo, UNDO_MS);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to clear selections';
    }
  }

  async function handleUndo() {
    const ids = clearedIds;
    hideUndo();
    try {
      await selectEventsByType(ids);
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to restore selections';
    }
  }

  onDestroy(() => clearTimeout(undoTimer));

  function handleSaveCalendar() {
    if ($selectedCount === 0) {
      error = $t.myEvents.selectAtLeastOneSave;
      return;
    }
    showSaveModal = true;
  }

  async function handleLoadCalendar(eventIds: string[]) {
    await clearAllSelections();
    for (const id of eventIds) {
      await toggleEventSelection(id);
    }
  }

  async function handleEnablePush() {
    enablingPush = true;
    try {
      await PushService.subscribe();
      pushEnabled = true;
    } catch {
      pushEnabled = false;
    } finally {
      enablingPush = false;
    }
  }

  async function handleDisablePush() {
    enablingPush = true;
    try {
      await PushService.unsubscribe();
      pushEnabled = false;
    } finally {
      enablingPush = false;
    }
  }

  async function handleTestPush() {
    sendingTestPush = true;
    try {
      const { error: invokeError } = await supabase.functions.invoke('send-push-notifications', {
        body: { test: true },
      });
      if (invokeError) throw invokeError;
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : $t.myEvents.notifTestFailed;
    } finally {
      sendingTestPush = false;
    }
  }

  function exportToCalendar() {
    if (!isLoggedIn) return;
    if ($selectedCount === 0) {
      error = $t.myEvents.selectAtLeastOne;
      return;
    }

    exporting = true;
    try {
      const selectedEvents = events
        .filter(e => $selectedEventIds.has(e.id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const content = generateICalContent(selectedEvents);
      downloadICalFile(content, 'bmx-events.ics');
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : $t.myEvents.exportFailed;
    } finally {
      exporting = false;
    }
  }
</script>

<div class="my-events-page">
  <div class="header">
    <h1>{$t.myEvents.title}</h1>
    <p class="subtitle">{$t.myEvents.subtitle}</p>
  </div>

  {#if $selectedCount > 0}
    <div class="selection">
      <div class="top">
        <span class="count">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
          </svg>
          {interpolate($t.myEvents.selected, { count: $selectedCount })}
        </span>
        <button type="button" class="clear" on:click={handleClearAll}>{$t.myEvents.clearSelection}</button>
      </div>

      {#if isLoggedIn}
        <div class="actions">
          <div class="act act-export">
            <Button fullWidth on:click={exportToCalendar} disabled={exporting}>
              {exporting ? $t.myEvents.exporting : $t.myEvents.exportToCalendar}
            </Button>
          </div>
          <div class="act act-save">
            <Button variant="ghost" fullWidth on:click={handleSaveCalendar}>
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

  {#if isLoggedIn}
    <SavedCalendarsList
      refreshTrigger={savedCalendarsRefresh}
      on:load={(e) => handleLoadCalendar(e.detail)}
    />
  {/if}

  {#if showNotifications && !loading}
    <div class="notif-section">
      <h2 class="notif-title">{$t.myEvents.notifTitle}</h2>
      <p class="notif-description">{$t.myEvents.notifDescription}</p>

      {#if !pushSupported}
        <p class="notif-unsupported">{$t.myEvents.notifPushUnsupported}</p>
      {:else if !pushEnabled}
        <Button variant="secondary" on:click={handleEnablePush} disabled={enablingPush}>
          {$t.myEvents.notifEnablePush}
        </Button>
      {:else}
        <p class="notif-enabled">{$t.myEvents.notifPushEnabled}</p>
        <p class="notif-description">{$t.myEvents.notifDescription}</p>
        <div class="notif-actions">
          <Button variant="secondary" on:click={handleTestPush} disabled={sendingTestPush || enablingPush}>
            {sendingTestPush ? $t.myEvents.notifTesting : $t.myEvents.notifTestPush}
          </Button>
          <Button variant="secondary" on:click={handleDisablePush} disabled={enablingPush || sendingTestPush}>
            {$t.myEvents.notifDisablePush}
          </Button>
        </div>
      {/if}
    </div>
  {/if}

  {#if loading}
    <div class="loading-container">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error">{error}</p>
    </div>
  {:else}
    {#if eventTypes.length > 0}
      <div class="type-selector" role="group" aria-label={$t.myEvents.selectByType}>
        <span class="type-selector-label">{$t.myEvents.selectByType}</span>
        <div class="type-buttons">
          {#each eventTypes as { type, ids } (type.id)}
            {@const fully = isTypeFullySelected(ids, $selectedEventIds)}
            {@const partial = isTypePartiallySelected(ids, $selectedEventIds)}
            <TypeChip
              type={type.name}
              count={ids.length}
              state={fully ? 'on' : partial ? 'partial' : 'off'}
              title="{fully ? $t.myEvents.deselectAll : $t.myEvents.selectAll} {type.name} ({ids.length})"
              on:click={() => handleTypeToggle(ids)}
            />
          {/each}
        </div>
      </div>
    {/if}

    <div class="timeline">
      {#each sortedEvents as event (event.id)}
        {@const view = getRaceView(event, $t)}
        {@const selected = $selectedEventIds.has(event.id)}
        <RaceRow
          title={event.title}
          href={view.href}
          day={view.day}
          month={view.month}
          meta={view.meta}
          type={event.event_type?.name}
          status={view.status}
          registrationUrl={event.registration_url}
          registerLabel={$t.calendar.registerAction}
          opensLabel={view.opensLabel}
          deadlineLabel={view.deadlineLabel}
          saved={selected}
          saveLabel={selected ? $t.calendar.saved : $t.calendar.save}
          on:click={(e) => openDetail(e, view.href)}
          on:save={() => handleToggle(event.id)}
        />
      {/each}
    </div>
  {/if}
</div>

{#if undoVisible}
  <div class="undo" role="status">
    <span>{clearedIds.length === 1 ? $t.myEvents.selectionClearedOne : interpolate($t.myEvents.selectionCleared, { count: clearedIds.length })}</span>
    <button type="button" class="undo-btn" on:click={handleUndo}>{$t.myEvents.undo}</button>
  </div>
{/if}

<SaveCalendarModal
  open={showSaveModal}
  selectedEventIds={Array.from($selectedEventIds)}
  on:saved={() => { showSaveModal = false; savedCalendarsRefresh += 1; }}
  on:close={() => { showSaveModal = false; }}
/>

<style>
  .my-events-page {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-md);
  }

  .header {
    margin-block-end: var(--spacing-lg);
  }

  h1 {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--spacing-xs);
    color: var(--color-text-primary);
  }

  .subtitle {
    color: var(--color-text-secondary);
    margin: 0;
  }

  /* Selection bar: count and clear on one bar, then two equal actions */
  .selection {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-block-end: var(--spacing-lg);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    min-block-size: calc(var(--touch-target-min) + var(--spacing-sm));
    padding-inline: var(--spacing-md) var(--spacing-xs);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-md);
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

  .undo {
    position: fixed;
    inset-block-end: var(--spacing-lg);
    inset-inline: var(--spacing-md);
    margin-inline: auto;
    inline-size: fit-content;
    max-inline-size: calc(100% - 2 * var(--spacing-md));
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-xs) var(--spacing-xs) var(--spacing-xs) var(--spacing-md);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-lg);
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
    .selection {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      padding-inline-end: var(--spacing-sm);
      background-color: var(--color-bg-secondary);
      border-radius: var(--border-radius-md);
    }

    .top {
      background-color: transparent;
    }

    .actions {
      grid-template-columns: repeat(2, auto);
      align-items: center;
    }

    .act-save {
      order: -1;
    }

    .actions.account {
      grid-template-columns: 1fr auto auto;
    }
  }

  .loading-container {
    display: flex;
    justify-content: center;
    padding: var(--spacing-3xl) 0;
  }

  .error-container {
    background: var(--color-bg-primary);
    border: 2px solid var(--color-danger);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
  }

  .error {
    color: var(--color-danger);
    text-align: center;
    margin: 0;
  }

  .type-selector {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm-plus);
    margin-bottom: var(--spacing-md);
    flex-wrap: wrap;
  }

  .type-selector-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .type-buttons {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
  }

  .timeline {
    display: flex;
    flex-direction: column;
  }

  .notif-section {
    margin-top: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-lg);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
  }

  .notif-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .notif-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-md) 0;
    line-height: 1.5;
  }

  .notif-enabled {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-success);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .notif-unsupported,
  .notif-no-types {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  @media (max-width: 640px) {
    .header {
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .header-actions {
      width: 100%;
      justify-content: space-between;
    }

    .count {
      order: -1;
      width: 100%;
      text-align: center;
    }

    .type-selector {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
