import { useEffect, useId, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';

import { TextInput } from './Field';
import { floatIn, useDismiss, useFloating } from './floating';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

const pad = (n: number) => String(n).padStart(2, '0');

export const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function fromIsoDate(iso: string | null | undefined): Date | null {
  if (iso == null) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match === null) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toIsoDate(date) === iso ? date : null;
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const addMonths = (date: Date, months: number) => {
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), daysIn(first.getFullYear(), first.getMonth())));
};
const sameDay = (a: Date | null, b: Date | null) => a !== null && b !== null && toIsoDate(a) === toIsoDate(b);

type PartKind = 'year' | 'month' | 'day';

const numericFormat = (locale: string | undefined) =>
  new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });

function partOrder(locale: string | undefined): PartKind[] {
  return numericFormat(locale)
    .formatToParts(new Date(2026, 10, 23))
    .map((part) => part.type)
    .filter((type): type is PartKind => type === 'year' || type === 'month' || type === 'day');
}

function inputPattern(locale: string | undefined) {
  return numericFormat(locale)
    .formatToParts(new Date(2026, 10, 23))
    .map((part) => (part.type === 'year' ? 'yyyy' : part.type === 'month' ? 'mm' : part.type === 'day' ? 'dd' : part.value))
    .join('');
}

export function parseDateInput(text: string, locale?: string): Date | null {
  const groups = text.match(/\d+/g);
  if (groups === null || groups.length !== 3) return null;
  const order: PartKind[] = groups[0]!.length === 4 ? ['year', 'month', 'day'] : partOrder(locale);
  const parts: Record<PartKind, number> = { year: NaN, month: NaN, day: NaN };
  order.forEach((kind, index) => {
    parts[kind] = Number(groups[index]);
  });
  const year = parts.year < 100 ? parts.year + 2000 : parts.year;
  const date = new Date(year, parts.month - 1, parts.day);
  return date.getFullYear() === year && date.getMonth() === parts.month - 1 && date.getDate() === parts.day ? date : null;
}

export function firstDayOfWeek(locale?: string): number {
  try {
    const tag = locale ?? (typeof navigator === 'undefined' ? 'en-US' : navigator.language);
    const info = new Intl.Locale(tag) as Intl.Locale & { weekInfo?: { firstDay: number }; getWeekInfo?: () => { firstDay: number } };
    const week = info.getWeekInfo?.() ?? info.weekInfo;
    if (week !== undefined) return week.firstDay % 7;
  } catch {
    return 1;
  }
  return 1;
}

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  min?: string;
  max?: string;
  locale?: string;
  weekStartsOn?: number;
  isDateDisabled?: (date: Date) => boolean;
  placeholder?: string;
  label?: string;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  todayLabel?: string;
  clearLabel?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  locale,
  weekStartsOn,
  isDateDisabled,
  placeholder,
  label,
  id,
  invalid,
  disabled = false,
  clearable = true,
  todayLabel = 'Today',
  clearLabel = 'Clear',
  className,
}: Readonly<DatePickerProps>) {
  const dialogId = useId();
  const titleId = useId();
  const shell = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const selected = fromIsoDate(value);
  const minDate = fromIsoDate(min);
  const maxDate = fromIsoDate(max);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [view, setView] = useState(() => startOfMonth(selected ?? today));
  const [focus, setFocus] = useState(() => selected ?? today);
  const { style, side } = useFloating(open, shell, panel);

  const weekStart = weekStartsOn ?? firstDayOfWeek(locale);
  const formats = useMemo(
    () => ({
      numeric: numericFormat(locale),
      title: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      full: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
      pattern: inputPattern(locale),
    }),
    [locale],
  );

  const blocked = (date: Date) =>
    (minDate !== null && date < minDate) || (maxDate !== null && date > maxDate) || (isDateDisabled?.(date) ?? false);

  const close = (restore: boolean) => {
    setOpen(false);
    if (restore) input.current?.focus();
  };

  useDismiss(open, [shell, panel], () => close(false), { escape: false });

  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    panel.current?.querySelector<HTMLButtonElement>('button[data-focus]')?.focus();
  }, [open, focus, view]);

  const openCalendar = (intoGrid: boolean) => {
    if (disabled) return;
    const base = selected ?? (minDate !== null && today < minDate ? minDate : maxDate !== null && today > maxDate ? maxDate : today);
    setView(startOfMonth(base));
    setFocus(base);
    moveFocus.current = intoGrid;
    setOpen(true);
  };

  const choose = (date: Date | null) => {
    if (date !== null && blocked(date)) return;
    onChange(date === null ? null : toIsoDate(date));
    setDraft(null);
    close(true);
  };

  const commitDraft = () => {
    if (draft === null) return;
    if (draft.trim() === '') {
      onChange(null);
      setDraft(null);
      return;
    }
    const parsed = parseDateInput(draft, locale);
    if (parsed !== null && !blocked(parsed)) onChange(toIsoDate(parsed));
    setDraft(null);
  };

  const goTo = (date: Date) => {
    moveFocus.current = true;
    setFocus(date);
    if (date.getMonth() !== view.getMonth() || date.getFullYear() !== view.getFullYear()) setView(startOfMonth(date));
  };

  const onGridKey = (event: KeyboardEvent<HTMLTableElement>) => {
    const offset = (focus.getDay() - weekStart + 7) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -offset),
      End: () => addDays(focus, 6 - offset),
      PageUp: () => addMonths(focus, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    goTo(move());
  };

  const shiftView = (months: number) => {
    const next = addMonths(view, months);
    setView(startOfMonth(next));
    setFocus(addMonths(focus, months));
  };

  const gridStart = addDays(view, -((view.getDay() - weekStart + 7) % 7));
  const weeks = Array.from({ length: 6 }, (_, week) => Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)));
  const weekdays = weeks[0]!;
  const todayBlocked = blocked(today);

  return (
    <div className={cx('relative min-w-0', className)}>
      <div ref={shell}>
        <TextInput
          ref={input}
          id={id}
          invalid={invalid}
          disabled={disabled}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-label={label}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder ?? formats.pattern}
          value={draft ?? (selected === null ? '' : formats.numeric.format(selected))}
          onChange={(event) => setDraft(event.target.value)}
          onClick={() => {
            if (!open) openCalendar(false);
          }}
          onBlur={(event) => {
            commitDraft();
            const next = event.relatedTarget as Node | null;
            if (open && (next === null || !panel.current?.contains(next))) close(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (open) {
                moveFocus.current = true;
                setFocus((date) => new Date(date));
              } else openCalendar(true);
            } else if (event.key === 'Enter') {
              commitDraft();
            } else if (event.key === 'Escape' && open) {
              event.preventDefault();
              event.stopPropagation();
              close(false);
            }
          }}
          suffix={
            <button
              type="button"
              tabIndex={-1}
              aria-label="Choose date"
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => (open ? close(true) : openCalendar(true))}
              className="text-muted-color hover:bg-sunken hover:text-color flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors duration-150"
            >
              <i className="icon icon-calendar text-sm" aria-hidden />
            </button>
          }
        />
      </div>

      {open && (
        <div
          ref={panel}
          id={dialogId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          style={style}
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            close(true);
          }}
          onBlur={(event: FocusEvent<HTMLDivElement>) => {
            const next = event.relatedTarget as Node | null;
            if (next !== null && !panel.current?.contains(next) && !shell.current?.contains(next)) close(false);
          }}
          className={cx(
            'border-line bg-panel shadow-float z-50 w-[min(19rem,calc(100vw-1rem))] overflow-y-auto rounded-xl border p-3',
            floatIn(side),
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button type="button" aria-label="Previous month" onClick={() => shiftView(-1)} className={NAV}>
              <i className="icon icon-chevron-left text-xs" aria-hidden />
            </button>
            <h2 id={titleId} aria-live="polite" className="text-color text-sm font-semibold first-letter:uppercase">
              {formats.title.format(view)}
            </h2>
            <button type="button" aria-label="Next month" onClick={() => shiftView(1)} className={NAV}>
              <i className="icon icon-chevron-right text-xs" aria-hidden />
            </button>
          </div>

          <table role="grid" aria-labelledby={titleId} onKeyDown={onGridKey} className="w-full border-collapse">
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th
                    key={day.getDay()}
                    scope="col"
                    abbr={formats.weekdayLong.format(day)}
                    className="text-muted-color pb-1 text-[0.6875rem] font-medium"
                  >
                    {formats.weekdayShort.format(day).slice(0, 2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody key={toIsoDate(view)} className="transition-opacity duration-200 starting:opacity-0">
              {weeks.map((week) => (
                <tr key={toIsoDate(week[0]!)}>
                  {week.map((day) => {
                    const inMonth = day.getMonth() === view.getMonth();
                    const isSelected = sameDay(day, selected);
                    const isToday = sameDay(day, today);
                    const isFocus = sameDay(day, focus);
                    const off = blocked(day);
                    return (
                      <td key={toIsoDate(day)} aria-selected={isSelected} className="p-0.5 text-center">
                        <button
                          type="button"
                          tabIndex={isFocus ? 0 : -1}
                          data-focus={isFocus ? '' : undefined}
                          aria-label={formats.full.format(day)}
                          aria-current={isToday ? 'date' : undefined}
                          aria-disabled={off || undefined}
                          onClick={() => choose(day)}
                          onFocus={() => {
                            if (!isFocus) setFocus(day);
                          }}
                          className={cx(
                            'text-13 relative mx-auto flex size-9 items-center justify-center rounded-lg tabular-nums transition-colors duration-150 sm:size-8',
                            off ? 'text-muted-color/50 cursor-not-allowed line-through' : 'cursor-pointer',
                            isSelected
                              ? 'bg-primary text-primary-contrast font-semibold'
                              : cx(
                                  !off && 'hover:bg-sunken',
                                  inMonth ? 'text-color' : 'text-muted-color/60',
                                  isToday && 'text-primary font-semibold',
                                ),
                            isToday && !isSelected && 'after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-current',
                          )}
                        >
                          {day.getDate()}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-line-soft mt-2 flex items-center justify-between border-t pt-2">
            <button
              type="button"
              disabled={todayBlocked}
              onClick={() => choose(today)}
              className="text-primary hover:bg-highlight h-8 cursor-pointer rounded-lg px-2.5 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40"
            >
              {todayLabel}
            </button>
            {clearable && value !== null && (
              <button
                type="button"
                onClick={() => choose(null)}
                className="text-muted-color hover:bg-sunken hover:text-color h-8 cursor-pointer rounded-lg px-2.5 text-sm font-medium transition-colors duration-150"
              >
                {clearLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV =
  'text-muted-color hover:bg-sunken hover:text-color flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150';
