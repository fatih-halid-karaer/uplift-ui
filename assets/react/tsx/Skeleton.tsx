import type { CSSProperties } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

const WIDTHS = [72, 48, 60, 36, 84, 54];

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: Readonly<SkeletonProps>) {
  return (
    <span aria-hidden style={style} className={cx('bg-sunken block animate-pulse rounded-md motion-reduce:animate-none', className)} />
  );
}

export function SkeletonLine({ width = '100%', className }: Readonly<{ width?: string | number; className?: string }>) {
  return <Skeleton className={cx('h-3', className)} style={{ width }} />;
}

export function SkeletonCircle({ size = 40, className }: Readonly<{ size?: number; className?: string }>) {
  return <Skeleton className={cx('shrink-0 rounded-full', className)} style={{ width: size, height: size }} />;
}

export function SkeletonText({ lines = 3, className }: Readonly<{ lines?: number; className?: string }>) {
  return (
    <span aria-hidden className={cx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} />
      ))}
    </span>
  );
}

export function SkeletonCard({ label = 'Loading', className }: Readonly<{ label?: string; className?: string }>) {
  return (
    <div role="status" className={cx('border-line bg-panel flex flex-col gap-4 rounded-xl border p-4', className)}>
      <span className="sr-only">{label}…</span>
      <span aria-hidden className="flex items-center gap-3">
        <SkeletonCircle size={36} />
        <span className="flex flex-1 flex-col gap-2">
          <SkeletonLine width="45%" className="h-3.5" />
          <SkeletonLine width="30%" />
        </span>
      </span>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonRows({ rows = 5, columns, leading = 0 }: Readonly<{ rows?: number; columns: number; leading?: number }>) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden className="hover:[&>td]:bg-transparent">
          {Array.from({ length: columns }, (_, column) => (
            <td key={column}>
              {column < leading ? (
                <Skeleton className="size-4 rounded-[4px]" />
              ) : (
                <SkeletonLine width={`${WIDTHS[(row + column) % WIDTHS.length]}%`} className="h-3.5" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
