import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react';

import { Button } from './Button';
import { Dialog } from './Dialog';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: ReactNode;
  info?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  columns?: 1 | 2;
  submitLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  error?: ReactNode;
  submitDisabled?: boolean;
  danger?: boolean;
  noValidate?: boolean;
  extraAction?: ReactNode;
}

export function FormDialog({
  open,
  onClose,
  onSubmit,
  title,
  info,
  description,
  children,
  size = 'sm',
  columns = 1,
  submitLabel = 'Save',
  pendingLabel = 'Saving…',
  cancelLabel = 'Cancel',
  pending = false,
  error,
  submitDisabled = false,
  danger = false,
  noValidate = false,
  extraAction,
}: Readonly<FormDialogProps>) {
  const formId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const hasError = error !== undefined && error !== null && error !== false && error !== '';

  useEffect(() => {
    if (hasError) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [hasError, error]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      info={info}
      description={description}
      size={size}
      tone={danger ? 'danger' : 'primary'}
      dismissible={!pending}
      actions={
        <>
          {extraAction !== undefined && <div className="flex sm:mr-auto max-sm:basis-full">{extraAction}</div>}
          <Button variant="text" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant={danger ? 'danger' : 'primary'}
            loading={pending}
            loadingLabel={pendingLabel}
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate={noValidate}
        aria-busy={pending || undefined}
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending) onSubmit(event);
        }}
        className={cx('grid gap-4', columns === 2 && 'sm:grid-cols-2')}
      >
        {children}
        {hasError && (
          <div
            ref={errorRef}
            role="alert"
            className={cx(
              'border-danger-line bg-danger-soft text-danger-ink text-13 flex gap-2.5 rounded-lg border px-3 py-2.5 leading-relaxed',
              columns === 2 && 'sm:col-span-2',
            )}
          >
            <i className="icon icon-circle-x text-danger mt-0.5 shrink-0 text-sm" aria-hidden />
            <div className="min-w-0 break-words">{error}</div>
          </div>
        )}
      </form>
    </Dialog>
  );
}
