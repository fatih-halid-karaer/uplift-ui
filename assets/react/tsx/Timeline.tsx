import type { ReactNode } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type TimelineTone = 'primary' | 'success' | 'warn' | 'danger' | 'info' | 'neutral';

export interface TimelineItem {
  id: string;
  title: ReactNode;
  at: Date | string | number;
  description?: ReactNode;
  icon?: string;
  tone?: TimelineTone;
  meta?: ReactNode;
}

interface TimelineProps {
  items: readonly TimelineItem[];
  groupByDay?: boolean;
  now?: Date;
  locale?: string;
  label?: string;
  className?: string;
}

const DOT: Record<TimelineTone, string> = {
  primary: 'bg-highlight text-primary ring-primary/20',
  success: 'bg-success-soft text-success-ink ring-success-line',
  warn: 'bg-warn-soft text-warn-ink ring-warn-line',
  danger: 'bg-danger-soft text-danger-ink ring-danger-line',
  info: 'bg-info-soft text-info-ink ring-info-line',
  neutral: 'bg-sunken text-muted-color ring-line',
};

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

export function relativeTime(date: Date, now: Date = new Date(), locale?: string) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, 'second');
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function dayLabel(date: Date, now: Date, locale?: string) {
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = Math.round((start(date) - start(now)) / 86_400_000);
  if (Math.abs(diff) <= 1) {
    const text = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(diff, 'day');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

function Entry({ item, now, locale, last }: Readonly<{ item: TimelineItem; now: Date; locale?: string; last: boolean }>) {
  const date = new Date(item.at);
  const tone = item.tone ?? 'neutral';
  const absolute = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span aria-hidden className="bg-line absolute top-9 bottom-1 left-[0.9375rem] w-px" />}
      <span
        aria-hidden
        className={cx('relative flex size-[1.875rem] shrink-0 items-center justify-center rounded-full ring-1 ring-inset', DOT[tone])}
      >
        <i className={`icon icon-${item.icon ?? 'dot'} text-[0.8rem]`} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="text-color min-w-0 text-sm font-medium break-words">{item.title}</span>
          <time dateTime={date.toISOString()} title={absolute} className="text-muted-color shrink-0 text-xs tabular-nums">
            {relativeTime(date, now, locale)}
          </time>
        </div>
        {item.description !== undefined && <div className="text-muted-color text-13 leading-relaxed break-words">{item.description}</div>}
        {item.meta !== undefined && <div className="mt-1">{item.meta}</div>}
      </div>
    </li>
  );
}

export function Timeline({ items, groupByDay = false, now = new Date(), locale, label = 'Activity', className }: Readonly<TimelineProps>) {
  if (!groupByDay) {
    return (
      <ol aria-label={label} className={cx('flex flex-col', className)}>
        {items.map((item, index) => (
          <Entry key={item.id} item={item} now={now} locale={locale} last={index === items.length - 1} />
        ))}
      </ol>
    );
  }

  const groups: { key: string; date: Date; items: TimelineItem[] }[] = [];
  for (const item of items) {
    const date = new Date(item.at);
    const key = dayKey(date);
    const group = groups.at(-1);
    if (group !== undefined && group.key === key) group.items.push(item);
    else groups.push({ key, date, items: [item] });
  }

  return (
    <section aria-label={label} className={cx('flex flex-col gap-5', className)}>
      {groups.map((group) => (
        <section key={group.key} aria-label={dayLabel(group.date, now, locale)} className="flex flex-col gap-3">
          <h3 className="text-muted-color bg-panel sticky top-0 z-[1] py-1 text-xs font-medium">{dayLabel(group.date, now, locale)}</h3>
          <ol className="flex flex-col">
            {group.items.map((item, index) => (
              <Entry key={item.id} item={item} now={now} locale={locale} last={index === group.items.length - 1} />
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
