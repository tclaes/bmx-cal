import '@testing-library/jest-dom';

if (!import.meta.env.VITE_SUPABASE_URL) {
  import.meta.env.VITE_SUPABASE_URL = 'https://mock-supabase-project.supabase.co';
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  import.meta.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key';
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// jsdom does not implement <dialog> methods; mimic the parts the app relies on.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
    this.dataset.modal = 'true';
    this.querySelector<HTMLElement>('button, [autofocus]')?.focus();
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    delete this.dataset.modal;
    // Browsers queue the close event as a task after `open` is cleared.
    setTimeout(() => this.dispatchEvent(new Event('close')), 0);
  };
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
