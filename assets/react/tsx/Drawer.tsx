import { useId, type ReactNode } from 'react';

import { useModal } from './overlay';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type DrawerSide = 'left' | 'right' | 'bottom';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  title?: ReactNode;
  label?: string;
  info?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  closeLabel?: string;
  bodyClassName?: string;
}

const PLACE: Record<DrawerSide, { dialog: string; surface: string; hidden: string }> = {
  left: {
    dialog: 'm-0 mr-auto h-dvh max-h-none',
    surface: 'h-full border-r',
    hidden: 'starting:-translate-x-full',
  },
  right: {
    dialog: 'm-0 ml-auto h-dvh max-h-none',
    surface: 'h-full border-l',
    hidden: 'starting:translate-x-full',
  },
  bottom: {
    dialog: 'm-0 mt-auto h-fit max-h-none w-full',
    surface: 'max-h-[88dvh] rounded-t-2xl border-t',
    hidden: 'starting:translate-y-full',
  },
};

const GONE: Record<DrawerSide, string> = {
  left: '-translate-x-full',
  right: 'translate-x-full',
  bottom: 'translate-y-full',
};

export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  label,
  info,
  children,
  footer,
  width = 'w-[min(24rem,calc(100vw-3rem))]',
  closeLabel = 'Close',
  bodyClassName = 'p-5',
}: Readonly<DrawerProps>) {
  const titleId = useId();
  const { mounted, leaving, dialogProps, requestClose } = useModal(open, onClose);
  const place = PLACE[side];

  if (!mounted) return null;

  return (
    <dialog
      {...dialogProps}
      aria-labelledby={title !== undefined ? titleId : undefined}
      aria-label={title === undefined ? label : undefined}
      className={cx(
        'fixed inset-0 max-w-none overflow-visible border-0 bg-transparent p-0 text-color backdrop:bg-[rgb(10_14_24/0.4)]',
        place.dialog,
        side !== 'bottom' && width,
        leaving ? 'backdrop:animate-scrim-out' : 'backdrop:animate-scrim-in',
      )}
    >
      <div
        data-modal-surface
        tabIndex={-1}
        className={cx(
          'border-line bg-panel shadow-float flex w-full flex-col overflow-hidden outline-none transition-[translate]',
          place.surface,
          place.hidden,
          leaving ? `${GONE[side]} duration-200 ease-in` : 'duration-300 ease-[var(--ease-out-quint)]',
        )}
      >
        {side === 'bottom' && <span aria-hidden className="bg-line mx-auto mt-2 h-1 w-9 shrink-0 rounded-full" />}
        {title !== undefined && (
          <header className="border-line-soft flex h-14 shrink-0 items-center gap-1 border-b pr-3 pl-5">
            <h2 id={titleId} className="text-ink-emphasis min-w-0 truncate text-base font-semibold tracking-tight">
              {title}
            </h2>
            {info}
            <button
              type="button"
              data-modal-close
              aria-label={closeLabel}
              title={closeLabel}
              onClick={requestClose}
              className="text-muted-color hover:bg-sunken hover:text-color ml-auto flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150"
            >
              <i className="icon icon-x text-base" aria-hidden />
            </button>
          </header>
        )}
        <div className={cx('min-h-0 flex-1 overflow-y-auto overscroll-contain', bodyClassName)}>{children}</div>
        {footer !== undefined && (
          <div className="border-line-soft flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
