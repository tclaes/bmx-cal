import release from './release.json';

export type ReleaseNotes = Partial<Record<'nl' | 'fr' | 'en', string>>;

export const APP_VERSION: string = release.version;
export const MIN_VERSION: string = release.minVersion;
export const RELEASE_NOTES: ReleaseNotes = release.notes;
