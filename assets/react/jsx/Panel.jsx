const cx = (...parts) => parts.filter(Boolean).join(' ');
export function Panel({ title, meta, actions, footer, variant = 'default', flushBody = false, as: Tag = 'section', headingLevel = 3, className, children, }) {
  const Heading = `h${headingLevel}`;
  return (<Tag className={cx('b-panel', variant !== 'default' && `is-${variant}`, className)}>
    {(title || actions) && (<div className="b-panel-head">
      <div className="b-panel-title">
      {title && <Heading>{title}</Heading>}
      {meta && <small>{meta}</small>}
      </div>
      {actions && <div className="b-panel-actions">{actions}</div>}
    </div>)}
    <div className={cx('b-panel-body', flushBody && 'is-flush')}>{children}</div>
    {footer && <div className="b-panel-foot">{footer}</div>}
  </Tag>);
}
export function KeyValue({ items, stacked = false, className }) {
  if (stacked) {
    return (<dl className={cx('b-kv is-stacked', className)}>
    {items.map((item, i) => (<div key={i}>
      <dt>{item.label}</dt>
      <dd>{item.value}</dd>
      </div>))}
    </dl>);
  }
  return (<dl className={cx('b-kv', className)}>
    {items.map((item, i) => (<div key={i} style={{ display: 'contents' }}>
      <dt>{item.label}</dt>
      <dd>{item.value}</dd>
    </div>))}
  </dl>);
}
