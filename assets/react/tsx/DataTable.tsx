import { Fragment, useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

import { Checkbox } from './Checkbox';
import { useMediaQuery } from './layout';
import { Pager, PAGE_SIZE, usePaged } from './pager';
import { SkeletonCard, SkeletonRows } from './Skeleton';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type SortValue = string | number | null | undefined;
export type SortDirection = 'ascending' | 'descending';

export interface DataColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => SortValue;
  align?: 'start' | 'center' | 'end';
  width?: string | number;
  hideBelow?: 'sm' | 'md' | 'lg';
}

export interface MobileLayout<T> {
  title: (row: T) => ReactNode;
  fields: readonly string[];
}

interface DataTableProps<T> {
  rows: readonly T[];
  columns: readonly DataColumn<T>[];
  rowKey: (row: T) => string;
  label: string;
  selectable?: boolean;
  onSelectionChange?: (keys: string[]) => void;
  expand?: (row: T) => ReactNode;
  actions?: (row: T) => ReactNode;
  paged?: boolean;
  pageSize?: number;
  empty?: ReactNode;
  loading?: boolean;
  error?: ReactNode;
  mobile?: MobileLayout<T>;
  maxHeight?: string | number;
  defaultSort?: { key: string; direction: SortDirection };
  className?: string;
}

const HIDE: Record<NonNullable<DataColumn<unknown>['hideBelow']>, string> = {
  sm: 'max-sm:hidden',
  md: 'max-md:hidden',
  lg: 'max-lg:hidden',
};

const ALIGN: Record<NonNullable<DataColumn<unknown>['align']>, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
};

const JUSTIFY: Record<NonNullable<DataColumn<unknown>['align']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end flex-row-reverse',
};

export function compareSortValues(a: SortValue, b: SortValue) {
  const emptyA = a === null || a === undefined || a === '';
  const emptyB = b === null || b === undefined || b === '';
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

const ICON_BUTTON =
  'text-muted-color hover:bg-sunken hover:text-color flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors duration-150';

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  label,
  selectable = false,
  onSelectionChange,
  expand,
  actions,
  paged = false,
  pageSize = PAGE_SIZE,
  empty,
  loading = false,
  error,
  mobile,
  maxHeight,
  defaultSort,
  className,
}: Readonly<DataTableProps<T>>) {
  const phone = useMediaQuery('(max-width: 639.98px)');
  const detailBase = useId();
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(defaultSort ?? null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  const signature = useMemo(() => rows.map(rowKey).join('\u0000'), [rows, rowKey]);

  const sorted = useMemo(() => {
    const column = sort === null ? undefined : columns.find((item) => item.key === sort.key);
    if (sort === null || column?.sortValue === undefined) return rows;
    const read = column.sortValue;
    const factor = sort.direction === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => compareSortValues(read(a), read(b)) * factor);
  }, [rows, columns, sort]);

  const { rows: visible, pager } = usePaged(sorted, paged ? pageSize : Math.max(1, sorted.length));
  const onPage = pager.onPage;

  useEffect(() => {
    setSelected((current) => (current.size === 0 ? current : new Set()));
    setOpen((current) => (current.size === 0 ? current : new Set()));
    onPage(0);
  }, [signature, onPage]);

  useEffect(() => {
    onSelectionChange?.([...selected]);
  }, [selected]);

  const cycleSort = (key: string) =>
    setSort((current) => {
      if (current === null || current.key !== key) return { key, direction: 'ascending' };
      if (current.direction === 'ascending') return { key, direction: 'descending' };
      return null;
    });

  const toggleRow = (key: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const toggleOpen = (key: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const visibleKeys = visible.map(rowKey);
  const pickedOnPage = visibleKeys.filter((key) => selected.has(key)).length;
  const headState: boolean | 'mixed' = pickedOnPage === 0 ? false : pickedOnPage === visibleKeys.length ? true : 'mixed';
  const toggleAll = (on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      for (const key of visibleKeys) {
        if (on) next.add(key);
        else next.delete(key);
      }
      return next;
    });

  const leading = (selectable ? 1 : 0) + (expand !== undefined ? 1 : 0);
  const span = columns.length + leading + (actions !== undefined ? 1 : 0);
  const wrapStyle: CSSProperties | undefined = maxHeight === undefined ? undefined : { maxHeight, overflowY: 'auto' };
  const status =
    error !== undefined && error !== null && error !== false ? 'error' : loading ? 'loading' : rows.length === 0 ? 'empty' : 'ready';

  const stateBlock =
    status === 'error' ? (
      <div role="alert">{error}</div>
    ) : status === 'empty' ? (
      (empty ?? <p className="text-muted-color text-13 px-4 py-10 text-center">Nothing to show yet.</p>)
    ) : null;

  if (phone && mobile !== undefined) {
    const fields = mobile.fields
      .map((key) => columns.find((column) => column.key === key))
      .filter((column): column is DataColumn<T> => column !== undefined);

    return (
      <div className={cx('flex flex-col gap-2', className)} aria-label={label} aria-busy={loading || undefined} role="region">
        {selectable && status === 'ready' && (
          <div className="flex items-center justify-between px-1">
            <Checkbox checked={headState} onChange={toggleAll} label="Select all on this page" />
            {selected.size > 0 && <span className="text-muted-color text-13 tabular-nums">{selected.size} selected</span>}
          </div>
        )}
        {status === 'loading' && Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
        {stateBlock}
        {status === 'ready' && (
          <ul className="flex flex-col gap-2">
            {visible.map((row) => {
              const key = rowKey(row);
              const isOpen = open.has(key);
              const detailId = `${detailBase}-${key}`;
              const rowActions = actions?.(row);
              return (
                <li
                  key={key}
                  className={cx(
                    'border-line bg-panel shadow-card flex flex-col gap-3 rounded-xl border p-4',
                    'transition-[opacity,translate] duration-300 ease-[var(--ease-out-quint)] starting:translate-y-1.5 starting:opacity-0',
                    selected.has(key) && 'ring-primary/40 ring-2',
                  )}
                >
                  <div className="flex items-start gap-3">
                    {selectable && (
                      <Checkbox checked={selected.has(key)} onChange={(on) => toggleRow(key, on)} label="Select row" hideLabel />
                    )}
                    <div className="text-color min-w-0 flex-1 font-medium break-words">{mobile.title(row)}</div>
                    {expand !== undefined && (
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={detailId}
                        aria-label={isOpen ? 'Hide details' : 'Show details'}
                        onClick={() => toggleOpen(key)}
                        className={ICON_BUTTON}
                      >
                        <i
                          aria-hidden
                          className={cx('icon icon-chevron-down text-xs transition-transform duration-200', isOpen && 'rotate-180')}
                        />
                      </button>
                    )}
                  </div>
                  {fields.length > 0 && (
                    <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-1.5 text-sm">
                      {fields.map((column) => (
                        <Fragment key={column.key}>
                          <dt className="text-muted-color text-13">{column.header}</dt>
                          <dd className="text-color min-w-0 break-words">{column.cell(row)}</dd>
                        </Fragment>
                      ))}
                    </dl>
                  )}
                  {expand !== undefined && isOpen && (
                    <div id={detailId} className="border-line-soft border-t pt-3">
                      {expand(row)}
                    </div>
                  )}
                  {rowActions !== undefined && rowActions !== null && <div className="flex justify-end gap-1">{rowActions}</div>}
                </li>
              );
            })}
          </ul>
        )}
        {paged && status === 'ready' && <Pager {...pager} />}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="ui-table-wrap" style={wrapStyle}>
        <table className="ui-table" aria-label={label} aria-busy={loading || undefined}>
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className="w-10 !pr-0">
                  <Checkbox
                    checked={status === 'ready' ? headState : false}
                    disabled={status !== 'ready'}
                    onChange={toggleAll}
                    label="Select all rows on this page"
                    hideLabel
                  />
                </th>
              )}
              {expand !== undefined && (
                <th scope="col" className="w-10 !pr-0">
                  <span className="sr-only">Details</span>
                </th>
              )}
              {columns.map((column) => {
                const align = column.align ?? 'start';
                const active = sort?.key === column.key ? sort.direction : undefined;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={column.sortValue === undefined ? undefined : (active ?? 'none')}
                    style={column.width === undefined ? undefined : { width: column.width }}
                    className={cx(ALIGN[align], column.hideBelow !== undefined && HIDE[column.hideBelow])}
                  >
                    {column.sortValue === undefined ? (
                      column.header
                    ) : (
                      <button
                        type="button"
                        onClick={() => cycleSort(column.key)}
                        className={cx(
                          'group/sort hover:text-color -mx-1 inline-flex cursor-pointer items-center gap-1 rounded px-1 transition-colors duration-150',
                          JUSTIFY[align],
                          active !== undefined && 'text-color',
                        )}
                      >
                        {column.header}
                        <i
                          aria-hidden
                          className={cx(
                            'icon icon-arrow-up text-[0.7rem] transition-[rotate,opacity] duration-200 ease-[var(--ease-out-quint)]',
                            active === 'descending' && 'rotate-180',
                            active === undefined
                              ? 'opacity-0 group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50'
                              : 'opacity-100',
                          )}
                        />
                      </button>
                    )}
                  </th>
                );
              })}
              {actions !== undefined && (
                <th scope="col" className="text-right">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && <SkeletonRows rows={Math.min(pageSize, 5)} columns={span} leading={selectable ? 1 : 0} />}
            {stateBlock !== null && (
              <tr className="hover:[&>td]:bg-transparent">
                <td colSpan={span} className="!p-0">
                  {stateBlock}
                </td>
              </tr>
            )}
            {status === 'ready' &&
              visible.map((row) => {
                const key = rowKey(row);
                const isOpen = open.has(key);
                const detailId = `${detailBase}-${key}`;
                return (
                  <Fragment key={key}>
                    <tr
                      aria-selected={selectable ? selected.has(key) : undefined}
                      className={cx(selected.has(key) && '[&>td]:bg-highlight')}
                    >
                      {selectable && (
                        <td className="w-10 !pr-0">
                          <Checkbox checked={selected.has(key)} onChange={(on) => toggleRow(key, on)} label="Select row" hideLabel />
                        </td>
                      )}
                      {expand !== undefined && (
                        <td className="w-10 !pr-0">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={isOpen ? detailId : undefined}
                            aria-label={isOpen ? 'Hide details' : 'Show details'}
                            onClick={() => toggleOpen(key)}
                            className={ICON_BUTTON}
                          >
                            <i
                              aria-hidden
                              className={cx(
                                'icon icon-chevron-right text-xs transition-transform duration-200 ease-[var(--ease-out-quint)]',
                                isOpen && 'rotate-90',
                              )}
                            />
                          </button>
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cx(ALIGN[column.align ?? 'start'], column.hideBelow !== undefined && HIDE[column.hideBelow])}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                      {actions !== undefined && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">{actions(row)}</div>
                        </td>
                      )}
                    </tr>
                    {expand !== undefined && isOpen && (
                      <tr id={detailId} className="hover:[&>td]:bg-transparent">
                        <td colSpan={span} className="bg-subtle !rounded-lg">
                          <div className="transition-[opacity,translate] duration-200 ease-[var(--ease-out-quint)] starting:-translate-y-1 starting:opacity-0">
                            {expand(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
      {paged && status === 'ready' && <Pager {...pager} />}
    </div>
  );
}
