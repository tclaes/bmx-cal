/**
 * True for an unmodified primary click: the app may then navigate in place.
 * Cmd/Ctrl/Shift-clicks and other buttons keep the browser's own behaviour (new tab, new window).
 */
export function isPlainLeftClick(e: MouseEvent): boolean {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0);
}
