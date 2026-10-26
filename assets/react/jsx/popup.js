import { useSyncExternalStore } from 'react';
const CLOSE_LABEL = { success: 'Done', info: 'Got it', warn: 'Got it', error: 'Close' };
let queue = [];
let nextId = 1;
const listeners = new Set();
function emit() {
  for (const listener of listeners) listener();
}
function enqueue(entry) {
  return new Promise((resolve) => {
    queue = [...queue, { ...entry, id: nextId++, resolve }];
    emit();
  });
}
function notice(tone, title, options = {}) {
  return enqueue({
    tone,
    title,
    description: options.description,
    confirmLabel: options.closeLabel ?? CLOSE_LABEL[tone],
    danger: false,
  });
}
export const popup = {
  success: (title, options) => notice('success', title, options),
  info: (title, options) => notice('info', title, options),
  warn: (title, options) => notice('warn', title, options),
  error: (title, options) => notice('error', title, options),
  confirm: ({ title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'warn' }) =>
    enqueue({ tone: tone === 'danger' ? 'error' : 'warn', title, description, confirmLabel, cancelLabel, danger: tone === 'danger' }),
};
export function settle(id, confirmed) {
  const entry = queue.find((item) => item.id === id);
  if (entry === undefined) return;
  queue = queue.filter((item) => item.id !== id);
  entry.resolve(confirmed);
  emit();
}
export function useCurrentPopup() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => queue[0],
  );
}
