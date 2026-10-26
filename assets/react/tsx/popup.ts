import { useSyncExternalStore } from 'react';

export type PopupTone = 'success' | 'info' | 'warn' | 'error';

export interface NoticeOptions {
  description?: string;
  closeLabel?: string;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'warn' | 'danger';
}

export interface Popup {
  id: number;
  tone: PopupTone;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger: boolean;
  resolve: (confirmed: boolean) => void;
}

const CLOSE_LABEL: Record<PopupTone, string> = { success: 'Done', info: 'Got it', warn: 'Got it', error: 'Close' };

let queue: Popup[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function enqueue(entry: Omit<Popup, 'id' | 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    queue = [...queue, { ...entry, id: nextId++, resolve }];
    emit();
  });
}

function notice(tone: PopupTone, title: string, options: NoticeOptions = {}): Promise<boolean> {
  return enqueue({
    tone,
    title,
    description: options.description,
    confirmLabel: options.closeLabel ?? CLOSE_LABEL[tone],
    danger: false,
  });
}

export const popup = {
  success: (title: string, options?: NoticeOptions) => notice('success', title, options),
  info: (title: string, options?: NoticeOptions) => notice('info', title, options),
  warn: (title: string, options?: NoticeOptions) => notice('warn', title, options),
  error: (title: string, options?: NoticeOptions) => notice('error', title, options),
  confirm: ({ title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'warn' }: ConfirmOptions) =>
    enqueue({ tone: tone === 'danger' ? 'error' : 'warn', title, description, confirmLabel, cancelLabel, danger: tone === 'danger' }),
};

export function settle(id: number, confirmed: boolean): void {
  const entry = queue.find((item) => item.id === id);
  if (entry === undefined) return;
  queue = queue.filter((item) => item.id !== id);
  entry.resolve(confirmed);
  emit();
}

export function useCurrentPopup(): Popup | undefined {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => queue[0],
  );
}
