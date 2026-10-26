import { useState } from 'react';

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

export const PAGE_SIZE = 10;

export function usePaged<T>(items: readonly T[], pageSize = PAGE_SIZE, startAt = -1) {
  const [page, setPage] = useState(() => (startAt > 0 ? Math.floor(startAt / pageSize) : 0));
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages - 1);
  return {
    rows: items.slice(current * pageSize, current * pageSize + pageSize),
    pager: { page: current, pages, total: items.length, pageSize, onPage: setPage },
  };
}

export function pageList(page: number, pages: number): (number | 'gap')[] {
  const wanted = new Set([0, pages - 1, page - 1, page, page + 1].filter((p) => p >= 0 && p < pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

const STEP =
  'text-muted-color hover:bg-sunken hover:text-color flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40';

interface PagerProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}

export function Pager({ page, pages, total, pageSize, onPage }: Readonly<PagerProps>) {
  if (pages <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min(total, from + pageSize - 1);

  return (
    <nav aria-label="Pagination" className="border-line flex flex-wrap items-center justify-between gap-3 border-t px-1 py-2.5">
      <span className="text-muted-color text-13 tabular-nums">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => onPage(page - 1)} className={STEP}>
          <i className="icon icon-chevron-left text-xs" aria-hidden />
        </button>
        {pageList(page, pages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="text-muted-color text-13 w-6 text-center">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPage(p)}
              className={cx(
                'text-13 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 tabular-nums transition-colors duration-150',
                p === page ? 'bg-primary text-primary-contrast font-semibold' : 'text-color hover:bg-sunken',
              )}
            >
              {p + 1}
            </button>
          ),
        )}
        <button type="button" aria-label="Next page" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} className={STEP}>
          <i className="icon icon-chevron-right text-xs" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
