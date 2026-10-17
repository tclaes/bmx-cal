import { writable } from 'svelte/store';
import type { ImportLog } from '@types';

export interface ImportState {
  logs: ImportLog[];
  uploading: boolean;
  progress: number;
  error: string | null;
}

const initialState: ImportState = {
  logs: [],
  uploading: false,
  progress: 0,
  error: null,
};

function createImportStore() {
  const { subscribe, set, update } = writable<ImportState>(initialState);

  return {
    subscribe,
    setLogs: (logs: ImportLog[]) =>
      update(state => ({ ...state, logs })),
    setUploading: (uploading: boolean) =>
      update(state => ({ ...state, uploading })),
    setProgress: (progress: number) =>
      update(state => ({ ...state, progress })),
    setError: (error: string | null) =>
      update(state => ({ ...state, error })),
    addLog: (log: ImportLog) =>
      update(state => ({ ...state, logs: [log, ...state.logs] })),
    reset: () => set(initialState),
  };
}

export const importStore = createImportStore();
