<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, Badge, Button } from '@shared/components';
  import type { EventWithType } from '@types';
  import { authStore } from '@shared/stores';

  export let event: EventWithType;

  const dispatch = createEventDispatcher();

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatTime(time: string | null): string {
    if (!time) return '';
    return time.substring(0, 5);
  }

  function handleEdit() {
    dispatch('edit', event);
  }
</script>

<Card padding="md" shadow="sm">
  <div class="event-card">
    <div class="event-header">
      <div class="event-header-left">
        <h3 class="event-title">{event.title}</h3>
        {#if event.event_type}
          <Badge label={event.event_type.name} color={event.event_type.color_code} />
        {/if}
      </div>
      {#if $authStore.isAuthenticated}
        <button class="edit-btn" on:click={handleEdit} aria-label="Edit event">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      {/if}
    </div>

    <div class="event-details">
      <div class="event-detail">
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>{formatDate(event.date)}</span>
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
        <span>{event.location}</span>
      </div>
    </div>

    {#if event.description}
      <p class="event-description">{event.description}</p>
    {/if}
  </div>
</Card>

<style>
  .event-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .event-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }

  .event-header-left {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    flex: 1;
  }

  .event-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
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
</style>
