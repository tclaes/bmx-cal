import type { EventWithDetails } from '@types';

export function searchEvents(
  events: EventWithDetails[],
  query: string
): EventWithDetails[] {
  if (!query?.trim()) {
    return events;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return events.filter(event => {
    return (
      event.title.toLowerCase().includes(normalizedQuery) ||
      event.location.toLowerCase().includes(normalizedQuery) ||
      event.description.toLowerCase().includes(normalizedQuery) ||
      (event.location_details?.city?.toLowerCase().includes(normalizedQuery) ?? false) ||
      (event.location_details?.country?.toLowerCase().includes(normalizedQuery) ?? false)
    );
  });
}
