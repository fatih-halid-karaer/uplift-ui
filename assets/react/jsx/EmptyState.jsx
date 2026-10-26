export function EmptyState({ title, hint, icon, mark, action }) {
  return (
    <div className="@container px-6 py-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center @md:flex-row @md:gap-7 @md:text-left">
        <span aria-hidden className="relative flex size-20 shrink-0 items-center justify-center">
          <span className="border-line absolute inset-0 rounded-full border border-dashed" />
          <span className="text-primary/25 flex size-13 items-center justify-center">{mark}</span>
          {icon !== undefined && (
            <span className="bg-panel border-line text-primary shadow-card absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border">
              <i className={`icon icon-${icon} text-sm`} />
            </span>
          )}
        </span>
        <div className="flex flex-col items-center gap-3 @md:items-start">
          <div className="flex flex-col gap-1">
            <p className="text-color text-base font-semibold tracking-tight">{title}</p>
            {hint !== undefined && <p className="text-muted-color text-13 max-w-[46ch] leading-relaxed">{hint}</p>}
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
