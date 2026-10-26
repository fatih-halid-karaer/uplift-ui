const cx = (...parts) => parts.filter(Boolean).join(' ');
const INK = {
  success: 'text-success-ink',
  warn: 'text-warn-ink',
  danger: 'text-danger-ink',
  info: 'text-info-ink',
  primary: 'text-primary',
  neutral: 'text-color',
  muted: 'text-muted-color',
};
const WORDS = {
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
const LOOKUP = new Map(Object.entries(WORDS).flatMap(([tone, words]) => words.map((word) => [word, tone])));
export function humanize(raw) {
  const spaced = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
export function toneFor(status, fallback = 'neutral') {
  if (status == null) return 'muted';
  return LOOKUP.get(humanize(status).toLowerCase()) ?? fallback;
}
export function StatusText({ status, tone, icon, title, children, className }) {
  const resolved = tone ?? toneFor(status);
  const text = children ?? (status == null || status === '' ? '—' : humanize(status));
  return (
    <span title={title} className={cx('ui-status items-center gap-1.5', INK[resolved], className)}>
      {icon !== undefined && <i className={`icon icon-${icon} text-[0.85em]`} aria-hidden />}
      {text}
    </span>
  );
}
