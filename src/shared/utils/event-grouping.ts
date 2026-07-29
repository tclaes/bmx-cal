import type { EventWithType } from '../../types';

export function groupEventsByYear(events: EventWithType[]): Map<number, EventWithType[]> {
  const map = new Map<number, EventWithType[]>();
  for (const evt of events) {
    const year = parseInt(evt.date.slice(0, 4), 10);
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(evt);
  }
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
}

export function getDefaultOpenYears(eventsByYear: Map<number, EventWithType[]>, currentYear: number): Set<number> {
  const open = new Set<number>();
  if (eventsByYear.has(currentYear)) {
    open.add(currentYear);
  }
  return open;
}
