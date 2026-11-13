export type RaceTypeKey = 'cv' | 'tc' | 'cw' | '3nc' | 'ec' | 'wc' | 'unknown';

const BY_NAME: Record<string, RaceTypeKey> = {
  'cycling vlaanderen': 'cv',
  'belgian cycling': 'tc',
  'wallonie cycling': 'cw',
  '3 nations cup': '3nc',
  'european cup': 'ec',
  'world cup': 'wc',
};

const KNOWN: RaceTypeKey[] = ['cv', 'tc', 'cw', '3nc', 'ec', 'wc'];

/** Resolves an event type name ("European Cup") or code ("EC") to a token key. */
export function getRaceTypeKey(type: string | null | undefined): RaceTypeKey {
  const normalized = (type ?? '').trim().toLowerCase();
  if (BY_NAME[normalized]) return BY_NAME[normalized];
  return (KNOWN as string[]).includes(normalized) ? (normalized as RaceTypeKey) : 'unknown';
}

/** Short label for a type: the code for known types, first 3 letters otherwise. */
export function getRaceTypeCode(type: string | null | undefined): string {
  const key = getRaceTypeKey(type);
  if (key !== 'unknown') return key.toUpperCase();
  return (type ?? '').trim().substring(0, 3).toUpperCase();
}
