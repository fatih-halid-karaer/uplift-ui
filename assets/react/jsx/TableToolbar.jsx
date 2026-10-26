import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from './Badge';
import { Checkbox } from './Checkbox';
import { TextInput } from './Field';
import { floatIn, useDismiss, useFloating } from './floating';
const cx = (...parts) => parts.filter(Boolean).join(' ');
export function FilterPanel({ filters, columns, className }) {
  const base = useId();
  return (
    <div className={cx('flex flex-col', className)}>
      <div className="border-line-soft flex items-center justify-between gap-3 border-b px-4 py-3">
        <span className="text-color text-sm font-semibold">Filters</span>
        <button
          type="button"
          disabled={filters.active === 0}
          onClick={filters.clear}
          className="text-primary text-13 cursor-pointer rounded font-medium hover:underline disabled:pointer-events-none disabled:opacity-40"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-col divide-y divide-[var(--color-line-soft)]">
        {columns.map((column) => {
          const headingId = `${base}-${column.key}`;
          const options = filters.choices[column.key] ?? [];
          const picked = filters.picks[column.key];
          return (
            <section key={column.key} aria-labelledby={headingId} className="flex flex-col gap-2 px-4 py-3">
              <h3 id={headingId} className="text-muted-color text-xs font-medium">
                {column.label}
              </h3>
              {column.kind === 'text' ? (
                <TextInput
                  aria-labelledby={headingId}
                  placeholder="Contains…"
                  value={filters.texts[column.key] ?? ''}
                  onChange={(event) => filters.setText(column.key, event.target.value)}
                />
              ) : options.length === 0 ? (
                <p className="text-muted-color text-13">No values</p>
              ) : (
                <div role="group" aria-labelledby={headingId} className="-mx-1 flex max-h-44 flex-col gap-1.5 overflow-y-auto px-1 py-0.5">
                  {options.map((option) => (
                    <Checkbox
                      key={option}
                      checked={picked?.has(option) ?? false}
                      onChange={() => filters.toggle(column.key, option)}
                      label={option}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
export function TableToolbar({
  filters,
  columns = [],
  searchPlaceholder = 'Search…',
  searchLabel = 'Search',
  extra,
  actions,
  shown,
  className,
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const panel = useRef(null);
  const panelId = useId();
  const { style, side } = useFloating(open, trigger, panel, { gap: 6 });
  useDismiss(open, [trigger, panel], (reason) => {
    setOpen(false);
    if (reason === 'escape') trigger.current?.focus();
  });
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => panel.current?.querySelector('input, button:not(:disabled)')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const count = shown ?? filters.rows.length;
  return (
    <div className={cx('flex flex-wrap items-center gap-2 py-3', className)}>
      <TextInput
        type="search"
        icon="search"
        aria-label={searchLabel}
        placeholder={searchPlaceholder}
        value={filters.search}
        onChange={(event) => filters.setSearch(event.target.value)}
        className="w-full sm:w-64"
      />
      {columns.length > 0 && (
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-haspopup="dialog"
          onClick={() => setOpen((value) => !value)}
          className={cx(
            'border-field-line text-color hover:bg-sunken flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium',
            'transition-colors duration-150',
            open && 'bg-sunken',
          )}
        >
          <i className="icon icon-list-filter text-muted-color" aria-hidden />
          Filters
          <Badge count={filters.active} label={`${filters.active} active`} />
        </button>
      )}
      {extra}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <span aria-live="polite" className="text-muted-color text-13 tabular-nums">
          {filters.filtering ? `Showing ${count} of ${filters.total}` : ''}
        </span>
        {actions}
      </div>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={panelId}
            role="dialog"
            aria-label="Filters"
            style={style}
            className={cx(
              'bg-panel border-line shadow-float z-50 w-72 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border',
              floatIn(side),
            )}
          >
            <FilterPanel filters={filters} columns={columns} />
          </div>,
          document.body,
        )}
    </div>
  );
}
