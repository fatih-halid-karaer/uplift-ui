import { useEffect, useId, useRef, useState } from 'react';

import { settle, useCurrentPopup, type Popup, type PopupTone } from './popup';

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

interface Look {
  icon: string;
  rail: string;
  heading: string;
  button: string;
}

const SOLID = 'bg-primary text-primary-contrast hover:bg-primary/90';
const DANGER = 'bg-danger text-white hover:bg-danger/90';
const WARN = 'bg-warn text-white hover:bg-warn/90';

const TONES: Record<PopupTone, Look> = {
  success: { icon: 'circle-check', rail: 'bg-success', heading: 'text-success-ink', button: SOLID },
  info: { icon: 'info', rail: 'bg-info', heading: 'text-info-ink', button: SOLID },
  warn: { icon: 'triangle-alert', rail: 'bg-warn', heading: 'text-warn-ink', button: WARN },
  error: { icon: 'circle-x', rail: 'bg-danger', heading: 'text-danger-ink', button: DANGER },
};

const CONFIRM: Look = { icon: 'circle-help', rail: 'bg-primary', heading: 'text-primary', button: SOLID };
const HEADING: Record<PopupTone, string> = { success: 'Success', info: 'Info', warn: 'Warning', error: 'Error' };
const GENERIC = new Set(['success', 'info', 'warning', 'error', 'done', 'something went wrong']);
const EXIT_MS = 140;

function lookFor(entry: Popup): Look {
  if (entry.cancelLabel === undefined) return TONES[entry.tone];
  if (entry.danger) return { ...TONES.error, icon: 'triangle-alert' };
  return entry.tone === 'warn' ? TONES.warn : CONFIRM;
}

function PopupDialog({ entry }: Readonly<{ entry: Popup }>) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const messageId = useId();
  const bodyId = useId();
  const [answer, setAnswer] = useState<boolean | null>(null);
  const look = lookFor(entry);
  const confirming = entry.cancelLabel !== undefined;
  const leaving = answer !== null;
  const message = GENERIC.has(entry.title.trim().toLowerCase()) ? null : entry.title;

  useEffect(() => {
    const dialog = ref.current!;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus({ focusVisible: false } as FocusOptions);
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    if (answer === null) return;
    const timer = setTimeout(() => settle(entry.id, answer), EXIT_MS);
    return () => clearTimeout(timer);
  }, [answer, entry.id]);

  const close = (confirmed: boolean) => setAnswer((current) => current ?? confirmed);

  return (
    <dialog
      ref={ref}
      role={confirming ? 'alertdialog' : 'dialog'}
      aria-labelledby={message === null ? headingId : `${headingId} ${messageId}`}
      aria-describedby={entry.description !== undefined ? bodyId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        close(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close(false);
      }}
      className={cx(
        'm-auto overflow-visible bg-transparent p-0 backdrop:bg-[rgb(10_14_24/0.4)]',
        leaving ? 'backdrop:animate-scrim-out' : 'backdrop:animate-scrim-in',
      )}
    >
      <div
        className={cx(
          'border-line bg-panel shadow-float relative w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl border py-5 pr-5 pl-6',
          leaving ? 'animate-popup-out' : 'animate-popup-in',
        )}
      >
        <span aria-hidden className={cx('absolute top-4 bottom-4 left-0 w-1 rounded-r-full', look.rail)} />

        <h2 id={headingId} className={cx('flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase', look.heading)}>
          <i className={`icon icon-${look.icon} text-sm`} aria-hidden />
          {confirming ? 'Confirm' : HEADING[entry.tone]}
        </h2>

        {message !== null && (
          <p id={messageId} className="text-color mt-2.5 text-base leading-snug font-semibold tracking-tight text-pretty break-words">
            {message}
          </p>
        )}
        {entry.description !== undefined && (
          <p id={bodyId} className="text-muted-color mt-1.5 text-sm leading-relaxed text-pretty break-words">
            {entry.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          {confirming && (
            <button
              type="button"
              disabled={leaving}
              data-autofocus={entry.danger ? '' : undefined}
              onClick={() => close(false)}
              className="text-muted-color hover:bg-sunken hover:text-color h-9 cursor-pointer rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150"
            >
              {entry.cancelLabel}
            </button>
          )}
          <button
            type="button"
            disabled={leaving}
            data-autofocus={entry.danger ? undefined : ''}
            onClick={() => close(true)}
            className={cx(
              'h-9 min-w-20 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-[background-color,scale] duration-150 active:scale-[.98]',
              entry.danger ? DANGER : look.button,
            )}
          >
            {entry.confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function PopupHost() {
  const current = useCurrentPopup();
  return current === undefined ? null : <PopupDialog key={current.id} entry={current} />;
}
