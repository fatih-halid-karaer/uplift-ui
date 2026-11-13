import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { focusQuietly } from './overlay';
import { FloatingPanel } from './Popover';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

const SEARCH_FROM = 9;

export interface FilterOption {
  value: string;
  label: string;
  tone?: string;
  hint?: string | number;
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
  allLabel?: string;
  clearable?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

interface Row extends FilterOption {
  all?: boolean;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  allLabel,
  clearable = true,
  size = 'md',
  className,
}: Readonly<FilterSelectProps>) {
  const anchor = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const current = options.find((option) => option.value === value);
  const active = clearable && value !== '';
  const searchable = options.length >= SEARCH_FROM;

  const rows = useMemo<Row[]>(() => {
    const needle = query.trim().toLocaleLowerCase();
    const shown = needle === '' ? options : options.filter((option) => option.label.toLocaleLowerCase().includes(needle));
    return clearable && needle === '' ? [{ value: '', label: allLabel ?? `Any ${label.toLowerCase()}`, all: true }, ...shown] : [...shown];
  }, [options, query, clearable, allLabel, label]);

  const show = () => {
    const start = rows.findIndex((row) => row.value === value);
    setCursor(Math.max(0, start));
    setOpen(true);
  };

  const close = (restore: boolean) => {
    setOpen(false);
    setQuery('');
    if (restore) focusQuietly(anchor.current);
  };

  const pick = (row: Row) => {
    onChange(row.all === true ? '' : row.value);
    close(true);
  };

  const move = (to: number) => {
    setCursor(to);
    list.current?.querySelector(`[data-index="${to}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    const last = rows.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(last, cursor + 1), ArrowUp: Math.max(0, cursor - 1), Home: 0, End: last };
    if (moves[event.key] !== undefined) {
      event.preventDefault();
      move(moves[event.key]);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const row = rows[cursor];
      if (row !== undefined) pick(row);
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  const hasTones = options.some((option) => option.tone !== undefined);

  return (
    <div className={cx('relative inline-flex flex-none', className)}>
      <button
        ref={anchor}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={active && current !== undefined ? `${label}: ${current.label}` : label}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={onKey}
        className={cx(
          'inline-flex items-center gap-2 rounded-lg border pl-3 whitespace-nowrap transition-[border-color,background-color,box-shadow] duration-150 outline-none',
          'focus-visible:ring-primary/25 focus-visible:ring-4',
          size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
          active ? 'pr-8' : 'pr-2.5',
          active
            ? 'border-primary/40 bg-primary/10 text-primary'
            : open
              ? 'border-primary bg-field text-color ring-primary/15 ring-4'
              : 'border-field-line bg-field text-muted-color hover:border-field-line-hover hover:text-color',
        )}
      >
        {active ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="opacity-75">{label}</span>
            <span aria-hidden className="bg-primary/30 h-3.5 w-px" />
            {current?.tone !== undefined && <span aria-hidden className="size-2 flex-none rounded-full" style={{ background: current.tone }} />}
            <span className="truncate font-medium">{current?.label}</span>
          </span>
        ) : (
          <span>{clearable ? label : (current?.label ?? label)}</span>
        )}
        {!active && <i aria-hidden className={cx('icon icon-chevron-down text-xs opacity-60 transition-transform duration-200', open && 'rotate-180')} />}
      </button>
      {active && (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          onClick={() => onChange('')}
          className="text-primary/70 hover:bg-primary/15 hover:text-primary absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
        >
          <i aria-hidden className="icon icon-x text-xs" />
        </button>
      )}

      <FloatingPanel
        open={open}
        anchor={anchor}
        onDismiss={(reason) => close(reason === 'escape')}
        onOpened={(panel) => (searchable ? panel.querySelector<HTMLInputElement>('input')?.focus() : focusQuietly(anchor.current))}
        onKeyDown={onKey}
        className="max-h-[min(22rem,60vh)] min-w-48 p-1"
      >
        {searchable && (
          <label className="relative m-1 mb-1.5 block flex-none">
            <span className="sr-only">Filter {label}</span>
            <i aria-hidden className="icon icon-search text-muted-color pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCursor(0);
              }}
              placeholder={`Find ${label.toLowerCase()}`}
              className="border-field-line bg-sunken focus:border-primary h-8 w-full rounded-md border pr-2 pl-8 text-sm outline-none"
            />
          </label>
        )}
        <ul ref={list} id={listId} role="listbox" aria-label={label} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {rows.length === 0 && <li className="text-muted-color px-3 py-6 text-center text-sm">No match</li>}
          {rows.map((row, index) => {
            const selected = row.all === true ? !active : row.value === value;
            return (
              <li
                key={row.all === true ? '__all' : row.value}
                role="option"
                aria-selected={selected}
                data-index={index}
                onPointerEnter={() => setCursor(index)}
                onClick={() => pick(row)}
                className={cx(
                  'flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors select-none',
                  index === cursor ? 'bg-subtle text-color' : 'text-muted-color',
                  selected && 'text-color font-medium',
                )}
              >
                {row.tone !== undefined ? (
                  <span aria-hidden className="size-2 flex-none rounded-full" style={{ background: row.tone }} />
                ) : (
                  hasTones && row.all !== true && <span aria-hidden className="size-2 flex-none" />
                )}
                <span className="min-w-0 flex-1 truncate">{row.label}</span>
                {row.hint !== undefined && <span className="text-muted-color text-xs tabular-nums">{row.hint}</span>}
                <i aria-hidden className={cx('icon icon-check text-primary text-sm', !selected && 'opacity-0')} />
              </li>
            );
          })}
        </ul>
      </FloatingPanel>
    </div>
  );
}
