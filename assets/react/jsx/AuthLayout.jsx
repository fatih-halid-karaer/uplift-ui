const cx = (...parts) => parts.filter(Boolean).join(' ');
export function AuthLayout({ variant = 'center', brand, corner, width, className, children }) {
  const card = (<div className="b-auth-card" style={width ? { ['--b-auth-w']: width } : undefined}>
    {children}
  </div>);
  return (<div className={cx('b-auth', `is-${variant}`, className)}>
    {variant === 'split' ? (<>
      {brand}
      <main className="b-auth-main">{card}</main>
    </>) : (<main style={{ display: 'contents' }}>{card}</main>)}
    {corner && <div className="b-auth-corner">{corner}</div>}
  </div>);
}
export function AuthLogo({ mark, name }) {
  return (<span className="b-auth-logo">
    <i aria-hidden="true">{mark}</i>
    {name}
  </span>);
}
export function AuthHead({ logo, title, subtitle }) {
  return (<div className="b-auth-head">
    {logo}
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </div>);
}
export function AuthBrand({ logo, title, text, points, quote }) {
  return (<aside className="b-auth-brand">
    {logo}
    <div className="b-auth-pitch">
    <h2>{title}</h2>
    {text && <p>{text}</p>}
    {points && points.length > 0 && (<ul className="b-auth-points">
      {points.map((point, i) => (<li key={i}>{point}</li>))}
      </ul>)}
    </div>
    {quote && (<blockquote className="b-auth-quote">
      <p>{quote.text}</p>
      <footer>
      {quote.avatar}
      {quote.author}
      </footer>
    </blockquote>)}
  </aside>);
}
export function SsoButtons({ providers, disabled = false }) {
  return (<div className="b-sso">
    {providers.map((provider) => (<button key={provider.id} type="button" className="b-btn" disabled={disabled} onClick={provider.onClick}>
      <i aria-hidden="true">{provider.mark}</i>
      {provider.label}
    </button>))}
  </div>);
}
export function AuthDivider({ children = 'or with email' }) {
  return <div className="b-divider">{children}</div>;
}
export function AuthAlert({ title, children }) {
  return (<div className="b-auth-alert" role="alert">
    <div>
    {title && <strong>{title} </strong>}
    {children}
    </div>
  </div>);
}
export function AuthSent({ icon, title, children, action, note }) {
  return (<div className="b-sent">
    <span className="b-sent-icon" aria-hidden="true">
    {icon}
    </span>
    <h2>{title}</h2>
    <p>{children}</p>
    {action}
    {note && <p className="b-auth-legal">{note}</p>}
  </div>);
}
