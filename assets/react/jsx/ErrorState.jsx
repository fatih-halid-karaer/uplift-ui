import { useId, useState } from 'react';
import { Button } from './Button';
const cx = (...parts) => parts.filter(Boolean).join(' ');
export function ErrorState({
  title = 'Something went wrong',
  description = 'The data could not be loaded. Try again in a moment.',
  icon = 'circle-alert',
  onRetry,
  retrying = false,
  retryLabel = 'Retry',
  details,
  detailsLabel = 'Technical details',
  action,
  className,
}) {
  const detailsId = useId();
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div role="alert" className={cx('border-danger-line bg-danger-soft rounded-xl border p-4 sm:p-5', className)}>
      <div className="flex gap-3 sm:gap-4">
        <span className="bg-panel text-danger shadow-card flex size-9 shrink-0 items-center justify-center rounded-full">
          <i className={`icon icon-${icon} text-[0.95rem]`} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-danger-ink text-sm font-semibold">{title}</p>
            {description !== undefined && <div className="text-danger-ink/85 text-13 leading-relaxed">{description}</div>}
          </div>
          {(onRetry !== undefined || details !== undefined || action !== undefined) && (
            <div className="flex flex-wrap items-center gap-2">
              {onRetry !== undefined && (
                <Button size="sm" icon="rotate-cw" loading={retrying} onClick={onRetry}>
                  {retryLabel}
                </Button>
              )}
              {action}
              {details !== undefined && (
                <button
                  type="button"
                  aria-expanded={showDetails}
                  aria-controls={detailsId}
                  onClick={() => setShowDetails((value) => !value)}
                  className="text-danger-ink text-13 hover:bg-panel/60 focus-visible:outline-primary inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 font-medium outline-none focus-visible:outline-2"
                >
                  {detailsLabel}
                  <i
                    aria-hidden
                    className={cx(
                      'icon icon-chevron-down text-sm transition-transform duration-300 ease-[var(--ease-out-quint)]',
                      showDetails && 'rotate-180',
                    )}
                  />
                </button>
              )}
            </div>
          )}
          {details !== undefined && (
            <div
              id={detailsId}
              inert={!showDetails}
              className={cx(
                'grid transition-[grid-template-rows] duration-300 ease-[var(--ease-out-quint)]',
                showDetails ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <pre className="bg-panel border-danger-line text-color max-h-60 overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {details}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const PAGE = {
  forbidden: {
    code: '403',
    icon: 'lock',
    title: 'You do not have access to this page',
    description: 'Ask an administrator to grant you access, or switch to an account that has it.',
    tone: 'bg-warn-soft text-warn-ink border-warn-line',
  },
  server: {
    code: '500',
    icon: 'server-crash',
    title: 'Something broke on our side',
    description: 'The problem has been logged. Try again in a moment; your work has not been lost.',
    tone: 'bg-danger-soft text-danger-ink border-danger-line',
  },
  maintenance: {
    icon: 'wrench',
    title: 'Down for scheduled maintenance',
    description: 'We are making improvements and will be back shortly.',
    tone: 'bg-info-soft text-info-ink border-info-line',
  },
  offline: {
    icon: 'wifi-off',
    title: 'You are offline',
    description: 'Check your connection. The page will work again once you are back online.',
    tone: 'bg-sunken text-muted-color border-line',
  },
};
export function ErrorPage({
  variant = 'server',
  code,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  onRetry,
  reference,
  className,
}) {
  const preset = PAGE[variant];
  const shownCode = code ?? preset.code;
  return (
    <main className={cx('bg-canvas flex min-h-dvh items-center justify-center px-4 py-12 sm:px-6', className)}>
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <span className={cx('flex size-16 items-center justify-center rounded-2xl border', preset.tone)}>
          <i className={`icon icon-${icon ?? preset.icon} text-2xl`} aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          {shownCode !== undefined && (
            <p className="text-muted-color text-13 font-semibold tracking-widest tabular-nums">ERROR {shownCode}</p>
          )}
          <h1 className="text-color text-xl font-semibold tracking-tight text-balance sm:text-2xl">{title ?? preset.title}</h1>
          <div className="text-muted-color text-sm leading-relaxed text-pretty">{description ?? preset.description}</div>
        </div>
        {(primaryAction !== undefined || secondaryAction !== undefined || onRetry !== undefined) && (
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-center">
            {secondaryAction}
            {primaryAction ??
              (onRetry !== undefined && (
                <Button variant="primary" icon="rotate-cw" onClick={onRetry}>
                  Try again
                </Button>
              ))}
          </div>
        )}
        {reference !== undefined && (
          <p className="text-muted-color text-xs">
            Reference <code className="bg-sunken text-color rounded px-1.5 py-0.5 font-mono select-all">{reference}</code>
          </p>
        )}
      </div>
    </main>
  );
}
