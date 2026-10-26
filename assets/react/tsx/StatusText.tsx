import type { ReactNode } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'primary' | 'neutral' | 'muted';

const INK: Record<StatusTone, string> = {
  success: 'text-success-ink',
  warn: 'text-warn-ink',
  danger: 'text-danger-ink',
  info: 'text-info-ink',
  primary: 'text-primary',
  neutral: 'text-color',
  muted: 'text-muted-color',
};

const WORDS: Record<Exclude<StatusTone, 'primary' | 'neutral'>, readonly string[]> = {
  success: [
    'active',
    'running',
    'published',
    'enabled',
    'healthy',
    'ok',
    'online',
    'success',
    'succeeded',
    'completed',
    'done',
    'approved',
    'passed',
    'connected',
    'ready',
    'live',
    'paid',
  ],
  warn: [
    'pending',
    'warning',
    'degraded',
    'paused',
    'queued',
    'waiting',
    'expiring',
    'partial',
    'review',
    'in review',
    'retrying',
    'stale',
  ],
  danger: [
    'failed',
    'failure',
    'error',
    'down',
    'rejected',
    'expired',
    'blocked',
    'critical',
    'revoked',
    'cancelled',
    'canceled',
    'unhealthy',
    'overdue',
  ],
  info: ['scheduled', 'syncing', 'updating', 'new', 'info', 'in progress', 'processing', 'deploying', 'running soon', 'starting'],
  muted: ['draft', 'disabled', 'archived', 'inactive', 'unknown', 'idle', 'stopped', 'none', 'offline', 'skipped', 'n/a'],
};

const LOOKUP = new Map<string, StatusTone>(
  (Object.entries(WORDS) as [StatusTone, readonly string[]][]).flatMap(([tone, words]) => words.map((word) => [word, tone] as const)),
);

export function humanize(raw: string) {
  const spaced = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function toneFor(status: string | null | undefined, fallback: StatusTone = 'neutral'): StatusTone {
  if (status == null) return 'muted';
  return LOOKUP.get(humanize(status).toLowerCase()) ?? fallback;
}

interface StatusTextProps {
  status?: string | null;
  tone?: StatusTone;
  icon?: string;
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function StatusText({ status, tone, icon, title, children, className }: Readonly<StatusTextProps>) {
  const resolved = tone ?? toneFor(status);
  const text = children ?? (status == null || status === '' ? '—' : humanize(status));

  return (
    <span title={title} className={cx('ui-status items-center gap-1.5', INK[resolved], className)}>
      {icon !== undefined && <i className={`icon icon-${icon} text-[0.85em]`} aria-hidden />}
      {text}
    </span>
  );
}
