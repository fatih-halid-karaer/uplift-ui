const cx = (...parts) => parts.filter(Boolean).join(' ');
export function PageHeading({ title, info, meta, actions, breadcrumbs, icon, level = 1, className, children }) {
  const Heading = level === 1 ? 'h1' : 'h2';
  const metaParts = Array.isArray(meta) ? meta : meta === undefined || meta === null ? [] : [meta];
  return (
    <header className={cx('flex min-w-0 flex-col gap-3', className)}>
      {breadcrumbs}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-[1_1_16rem] items-start gap-3">
          {icon !== undefined && (
            <span
              aria-hidden
              className="bg-highlight text-primary flex size-10 shrink-0 items-center justify-center rounded-xl max-sm:hidden"
            >
              <i className={`icon icon-${icon} text-lg`} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-h-10 items-center gap-1">
              <Heading className="text-ink-emphasis min-w-0 text-xl leading-tight font-semibold tracking-tight text-balance break-words sm:text-[1.375rem]">
                {title}
              </Heading>
              {info}
            </div>
            {metaParts.length > 0 && (
              <p className="text-muted-color text-13 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {metaParts.map((part, index) => (
                  <span key={index} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden className="bg-field-line size-1 rounded-full" />}
                    {part}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
        {actions !== undefined && (
          <div className="flex flex-wrap items-center gap-2 max-sm:w-full sm:mt-0.5 sm:justify-end max-sm:[&>*:last-child]:flex-1">
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}
