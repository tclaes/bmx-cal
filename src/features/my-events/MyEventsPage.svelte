<script lang="ts">
  import { onMount } from 'svelte';
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

  async function handleClearAll() {
    try {
      await clearAllSelections();
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to clear selections';
    }
  }

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
    <div>
      <h1>{$t.myEvents.title}</h1>
      <p class="subtitle">{$t.myEvents.subtitle}</p>
    </div>

    {#if $selectedCount > 0}
      <div class="header-actions">
        <span class="count">{interpolate($t.myEvents.selected, { count: $selectedCount })}</span>
        <Button variant="secondary" size="sm" on:click={handleClearAll}>
          {$t.myEvents.clearAll}
        </Button>
        {#if isLoggedIn}
          <Button variant="secondary" on:click={handleSaveCalendar}>
            {$t.myEvents.saveCalendar}
          </Button>
        {/if}
        <Button on:click={exportToCalendar} disabled={exporting}>
          {exporting ? $t.myEvents.exporting : $t.myEvents.exportToCalendar}
        </Button>
      </div>
    {/if}
  </div>

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
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
  }

  h1 {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
  }

  .subtitle {
    color: var(--color-text-secondary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
    flex-wrap: wrap;
  }

  .count {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-md);
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
