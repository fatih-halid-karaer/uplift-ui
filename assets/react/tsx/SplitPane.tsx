import { useEffect, useRef, useState, type ReactNode } from 'react';
import { parseSize, readStored, useMediaQuery, useResizeHandle, writeStored } from './layout';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

interface SplitPaneProps {
  list: ReactNode;
  detail: ReactNode;
  showDetail: boolean;
  onBack: () => void;
  backLabel?: string;
  detailTitle?: ReactNode;
  emptyDetail?: ReactNode;
  listLabel?: string;
  detailLabel?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  storageKey?: string;
  className?: string;
}

export function SplitPane({
  list,
  detail,
  showDetail,
  onBack,
  backLabel = 'Back',
  detailTitle,
  emptyDetail,
  listLabel = 'List',
  detailLabel = 'Details',
  defaultSize = 360,
  minSize = 260,
  maxSize = 640,
  storageKey,
  className,
}: Readonly<SplitPaneProps>) {
  const wide = useMediaQuery('(min-width: 1024px)');
  const root = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const [size, setSize] = useState(() => readStored(storageKey, parseSize(minSize, maxSize)) ?? defaultSize);

  const { dragging, handleProps } = useResizeHandle({
    size,
    min: minSize,
    max: maxSize,
    label: `Resize ${listLabel.toLowerCase()}`,
    origin: () => root.current?.getBoundingClientRect().left ?? 0,
    onResize: setSize,
    onCommit: (value) => writeStored(storageKey, String(value)),
  });

  useEffect(() => {
    if (!wide && showDetail) detailRef.current?.focus({ preventScroll: true });
  }, [wide, showDetail]);

  const stackedDetail = !wide && showDetail;

  return (
    <div
      ref={root}
      style={wide ? { gridTemplateColumns: `${size}px auto minmax(0, 1fr)` } : undefined}
      className={cx('bg-panel border-line relative grid h-full min-h-0 overflow-hidden rounded-xl border', className)}
    >
      <section aria-label={listLabel} hidden={stackedDetail} className="flex min-h-0 min-w-0 flex-col overflow-auto">
        {list}
      </section>
      {wide && (
        <div
          {...handleProps}
          className={cx(
            'group relative z-10 -mx-1.5 flex w-3 cursor-col-resize justify-center outline-none touch-none',
            'focus-visible:[&>span]:bg-primary data-dragging:[&>span]:bg-primary',
          )}
        >
          <span aria-hidden className="bg-line group-hover:bg-primary/50 h-full w-px transition-colors duration-150" />
          <span
            aria-hidden
            className="border-line bg-panel shadow-card text-muted-color absolute top-1/2 flex h-8 w-3 -translate-y-1/2 items-center justify-center rounded-full border opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-dragging:opacity-100"
          >
            <i className="icon icon-grip-vertical text-[0.6rem]" />
          </span>
        </div>
      )}
      {(wide || showDetail) && (
        <section
          ref={detailRef}
          tabIndex={-1}
          aria-label={detailLabel}
          className={cx(
            'flex min-h-0 min-w-0 flex-col overflow-auto outline-none',
            dragging && 'pointer-events-none select-none',
            stackedDetail && 'animate-[popup-in_260ms_var(--ease-out-quint)_both]',
          )}
        >
          {!wide && (
            <div className="border-line bg-panel/85 sticky top-0 z-10 flex items-center gap-2 border-b px-2 py-2 backdrop-blur-md">
              <button
                type="button"
                onClick={onBack}
                className="text-color hover:bg-sunken focus-visible:outline-primary inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium outline-none focus-visible:outline-2"
              >
                <i className="icon icon-arrow-left text-[0.95rem]" aria-hidden />
                {backLabel}
              </button>
              {detailTitle !== undefined && <div className="text-color min-w-0 flex-1 truncate text-sm font-semibold">{detailTitle}</div>}
            </div>
          )}
          {showDetail ? (
            detail
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              {emptyDetail ?? <p className="text-muted-color text-13">Select an item to see its details.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
