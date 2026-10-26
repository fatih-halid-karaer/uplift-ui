import { useId } from 'react';
import { useModal } from './overlay';
const cx = (...parts) => parts.filter(Boolean).join(' ');
const WIDTH = {
  sm: 'sm:w-[min(28rem,calc(100vw-2rem))]',
  md: 'sm:w-[min(36rem,calc(100vw-2rem))]',
  lg: 'sm:w-[min(48rem,calc(100vw-2rem))]',
  xl: 'sm:w-[min(64rem,calc(100vw-2rem))]',
};
const RAIL = {
  primary: 'bg-primary',
  info: 'bg-info',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
};
export const DIALOG_ELEMENT =
  'fixed inset-0 m-auto h-fit max-h-none w-fit max-w-none overflow-visible border-0 bg-transparent p-0 text-color backdrop:bg-[rgb(10_14_24/0.4)] max-sm:mx-0 max-sm:mb-0 max-sm:w-full';
export function Dialog({
  open,
  onClose,
  title,
  info,
  description,
  children,
  actions,
  size = 'sm',
  tone = 'primary',
  role = 'dialog',
  dismissible = true,
  closeButton = false,
  closeLabel = 'Close',
  bodyClassName,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const { mounted, leaving, dialogProps, requestClose } = useModal(open, onClose, { dismissible });
  if (!mounted) return null;
  const hasBody = children !== undefined && children !== null && children !== false;
  return (
    <dialog
      {...dialogProps}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description !== undefined ? descriptionId : undefined}
      className={cx(DIALOG_ELEMENT, leaving ? 'backdrop:animate-scrim-out' : 'backdrop:animate-scrim-in')}
    >
      <div
        data-modal-surface
        tabIndex={-1}
        className={cx(
          'border-line bg-panel shadow-float relative flex max-h-[min(52rem,calc(100dvh-2rem))] flex-col overflow-hidden rounded-xl border outline-none',
          WIDTH[size],
          'max-sm:max-h-[92dvh] max-sm:w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0',
          'max-sm:transition-[translate] max-sm:starting:translate-y-full',
          leaving
            ? 'sm:animate-popup-out max-sm:translate-y-full max-sm:duration-200 max-sm:ease-in'
            : 'sm:animate-popup-in max-sm:duration-300 max-sm:ease-[var(--ease-out-quint)]',
        )}
      >
        <span aria-hidden className={cx('absolute top-5 bottom-5 left-0 w-1 rounded-r-full max-sm:top-7', RAIL[tone])} />
        <span aria-hidden className="bg-line mx-auto mt-2 -mb-1 h-1 w-9 shrink-0 rounded-full sm:hidden" />

        <header className={cx('flex shrink-0 items-start gap-3 pt-5 pr-5 pl-6', !hasBody && actions === undefined && 'pb-5')}>
          <div className="min-w-0 flex-1">
            <div className="flex min-h-7 items-center gap-1">
              <h2 id={titleId} className="text-ink-emphasis text-lg leading-snug font-semibold tracking-tight text-pretty break-words">
                {title}
              </h2>
              {info}
            </div>
            {description !== undefined && (
              <p id={descriptionId} className="text-muted-color mt-1 text-sm leading-relaxed text-pretty">
                {description}
              </p>
            )}
          </div>
          {closeButton && (
            <button
              type="button"
              data-modal-close
              aria-label={closeLabel}
              title={closeLabel}
              onClick={requestClose}
              className="text-muted-color hover:bg-sunken hover:text-color -mt-1 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150"
            >
              <i className="icon icon-x text-base" aria-hidden />
            </button>
          )}
        </header>

        {hasBody && (
          <div className={cx('min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 pr-5 pb-5 pl-6', bodyClassName)}>{children}</div>
        )}

        {actions !== undefined && (
          <div
            className={cx(
              'flex shrink-0 flex-wrap items-center justify-end gap-2 pr-5 pb-5 pl-6',
              hasBody ? 'pt-1' : 'pt-5',
              'max-sm:border-line-soft max-sm:border-t max-sm:pt-3 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1',
            )}
          >
            {actions}
          </div>
        )}
      </div>
    </dialog>
  );
}
