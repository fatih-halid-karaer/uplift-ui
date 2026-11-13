import type { ReactNode } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

type PanelVariant = 'default' | 'flush' | 'tinted' | 'accent';

interface PanelProps {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  variant?: PanelVariant;
  flushBody?: boolean;
  as?: 'section' | 'article' | 'aside' | 'div';
  headingLevel?: 2 | 3 | 4;
  className?: string;
  children?: ReactNode;
}

export function Panel({
  title,
  meta,
  actions,
  footer,
  variant = 'default',
  flushBody = false,
  as: Tag = 'section',
  headingLevel = 3,
  className,
  children,
}: PanelProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <Tag className={cx('b-panel', variant !== 'default' && `is-${variant}`, className)}>
      {(title || actions) && (
        <div className="b-panel-head">
          <div className="b-panel-title">
            {title && <Heading>{title}</Heading>}
            {meta && <small>{meta}</small>}
          </div>
          {actions && <div className="b-panel-actions">{actions}</div>}
        </div>
      )}
      <div className={cx('b-panel-body', flushBody && 'is-flush')}>{children}</div>
      {footer && <div className="b-panel-foot">{footer}</div>}
    </Tag>
  );
}

interface KeyValueProps {
  items: { label: ReactNode; value: ReactNode }[];
  stacked?: boolean;
  className?: string;
}

export function KeyValue({ items, stacked = false, className }: KeyValueProps) {
  if (stacked) {
    return (
      <dl className={cx('b-kv is-stacked', className)}>
        {items.map((item, i) => (
          <div key={i}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className={cx('b-kv', className)}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
