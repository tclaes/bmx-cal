<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, Badge, Button } from '@shared/components';
  import type { EventWithDetails } from '@types';
  import { authStore, filtersStore } from '@shared/stores';

  export let event: EventWithDetails;

  const dispatch = createEventDispatcher();

  $: isAuthenticated = $authStore.user !== null;

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatDateRange(startDate: string, endDate: string | null): string {
    const start = new Date(startDate);

    if (!endDate) {
      return formatDate(startDate);
    }

    const end = new Date(endDate);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }

  function formatTime(time: string | null): string {
    if (!time) return '';
    return time.substring(0, 5);
  }

  function getEventTypeAbbreviation(name: string): string {
    const abbreviations: Record<string, string> = {
      '3 Nations Cup': '3NC',
      'Belgian Cycling': 'BC',
      'Cycling Vlaanderen': 'CV',
      'European Cup': 'EC',
      'Wallonie Cycling': 'WAL',
      'World Cup': 'WC',
    };
    return abbreviations[name] || name.substring(0, 3).toUpperCase();
  }

  function handleEdit() {
    console.log('Edit button clicked for event:', event.id);
    dispatch('edit', event);
  }

  function handleEventTypeClick(eventTypeId: string) {
    filtersStore.setEventTypes([eventTypeId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getGoogleMapsUrl(): string {
    if (event.location_details?.maps_url) {
      return event.location_details.maps_url;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
  }

  function getFridayBefore(dateStr: string): Date {
    const date = new Date(dateStr);
    const day = date.getDay();
    const daysUntilFriday = (day + 2) % 7;
    const friday = new Date(date);
    friday.setDate(date.getDate() - daysUntilFriday);
    friday.setHours(0, 0, 0, 0);
    return friday;
  }

  function getRegistrationStatus(): { label: string; color: string } | null {
    if (!event.registration_url) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fridayBefore = getFridayBefore(event.date);
    if (today >= fridayBefore) {
      return null;
    }

    if (event.registration_status === 'open') {
      return { label: 'Registration Open', color: '#10b981' };
    } else if (event.registration_status === 'closed') {
      return { label: 'Registration Closed', color: '#6b7280' };
    } else if (event.registration_status === 'upcoming') {
      return { label: 'Registration Opens Soon', color: '#f59e0b' };
    }

    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (deadline < today) {
        return { label: 'Registration Closed', color: '#6b7280' };
      }
    }

    return { label: 'Register Now', color: '#3b82f6' };
  }

  $: registrationStatus = getRegistrationStatus();
</script>

<Card padding="md" shadow="sm">
  <div class="event-card">
    <div class="event-header">
      <h3 class="event-title">{event.title}</h3>
      <div class="event-header-right">
        {#if event.event_type}
          <button
            class="badge-button"
            on:click={() => handleEventTypeClick(event.event_type.id)}
            title="Filter by {event.event_type.name}"
            aria-label="Filter by {event.event_type.name}"
          >
            <Badge label={getEventTypeAbbreviation(event.event_type.name)} color={event.event_type.color_code} />
          </button>
        {/if}
        {#if isAuthenticated}
          <button class="edit-btn" on:click={handleEdit} aria-label="Edit event">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <div class="event-details">
      <div class="event-detail">
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>{formatDateRange(event.date, event.end_date)}</span>
      </div>

      {#if event.start_time}
        <div class="event-detail">
          <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>{formatTime(event.start_time)}{event.end_time ? ` - ${formatTime(event.end_time)}` : ''}</span>
        </div>
      {/if}

      <div class="event-detail">
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <a
          href={getGoogleMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          class="location-link"
          title="View on Google Maps"
        >
          {event.location}
        </a>
      </div>
    </div>

    <div class="event-card-content">
      {#if event.description}
        <p class="event-description">{event.description}</p>
      {/if}
    </div>

    {#if event.registration_url && registrationStatus}
      <div class="registration-section">
        {#if event.registration_deadline}
          <div class="registration-deadline">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Registration deadline: {formatDate(event.registration_deadline)}</span>
          </div>
        {/if}
        <a
          href={event.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          class="registration-btn"
          style="background-color: {registrationStatus.color}"
        >
          {registrationStatus.label}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    {/if}
  </div>
</Card>

<style>
  .event-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    min-height: 100%;
  }

  .event-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }

  .event-header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  .event-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    flex: 1;
  }

  .event-card-content {
    flex: 1;
  }

  .badge-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .badge-button:hover {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  .badge-button:active {
    transform: translateY(0);
  }

  .edit-btn {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--color-text-secondary);
    border-radius: 4px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .edit-btn:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);
  }

  .edit-btn:active {
    transform: scale(0.95);
  }

  .event-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .event-detail {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .icon {
    flex-shrink: 0;
    color: var(--color-primary);
  }

  .event-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }

  .location-link {
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: all 0.2s;
    position: relative;
  }

  .location-link:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }

  .location-link:active {
    color: var(--color-primary-dark, var(--color-primary));
  }

  .registration-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-top: auto;
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }

  .registration-deadline {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .registration-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: 0.625rem 1rem;
    border-radius: 6px;
    color: white;
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .registration-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .registration-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
</style>
