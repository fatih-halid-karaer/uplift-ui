import type { ReactNode } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

type AuthVariant = 'split' | 'center' | 'glass' | 'minimal';

interface AuthLayoutProps {
  variant?: AuthVariant;
  brand?: ReactNode;
  corner?: ReactNode;
  width?: string;
  className?: string;
  children: ReactNode;
}

export function AuthLayout({ variant = 'center', brand, corner, width, className, children }: AuthLayoutProps) {
  const card = (
    <div className="b-auth-card" style={width ? { ['--b-auth-w' as string]: width } : undefined}>
      {children}
    </div>
  );
  return (
    <div className={cx('b-auth', `is-${variant}`, className)}>
      {variant === 'split' ? (
        <>
          {brand}
          <main className="b-auth-main">{card}</main>
        </>
      ) : (
        <main style={{ display: 'contents' }}>{card}</main>
      )}
      {corner && <div className="b-auth-corner">{corner}</div>}
    </div>
  );
}

interface AuthLogoProps {
  mark: ReactNode;
  name: ReactNode;
}

export function AuthLogo({ mark, name }: AuthLogoProps) {
  return (
    <span className="b-auth-logo">
      <i aria-hidden="true">{mark}</i>
      {name}
    </span>
  );
}

interface AuthHeadProps {
  logo?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
}

export function AuthHead({ logo, title, subtitle }: AuthHeadProps) {
  return (
    <div className="b-auth-head">
      {logo}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

interface AuthBrandProps {
  logo: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  points?: ReactNode[];
  quote?: { text: ReactNode; author: ReactNode; avatar?: ReactNode };
}

export function AuthBrand({ logo, title, text, points, quote }: AuthBrandProps) {
  return (
    <aside className="b-auth-brand">
      {logo}
      <div className="b-auth-pitch">
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        {points && points.length > 0 && (
          <ul className="b-auth-points">
            {points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        )}
      </div>
      {quote && (
        <blockquote className="b-auth-quote">
          <p>{quote.text}</p>
          <footer>
            {quote.avatar}
            {quote.author}
          </footer>
        </blockquote>
      )}
    </aside>
  );
}

interface SsoProvider {
  id: string;
  label: string;
  mark: ReactNode;
  onClick: () => void;
}

export function SsoButtons({ providers, disabled = false }: { providers: SsoProvider[]; disabled?: boolean }) {
  return (
    <div className="b-sso">
      {providers.map((provider) => (
        <button key={provider.id} type="button" className="b-btn" disabled={disabled} onClick={provider.onClick}>
          <i aria-hidden="true">{provider.mark}</i>
          {provider.label}
        </button>
      ))}
    </div>
  );
}

export function AuthDivider({ children = 'or with email' }: { children?: ReactNode }) {
  return <div className="b-divider">{children}</div>;
}

export function AuthAlert({ title, children }: { title?: ReactNode; children?: ReactNode }) {
  return (
    <div className="b-auth-alert" role="alert">
      <div>
        {title && <strong>{title} </strong>}
        {children}
      </div>
    </div>
  );
}

interface AuthSentProps {
  icon: ReactNode;
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  note?: ReactNode;
}

export function AuthSent({ icon, title, children, action, note }: AuthSentProps) {
  return (
    <div className="b-sent">
      <span className="b-sent-icon" aria-hidden="true">
        {icon}
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
      {note && <p className="b-auth-legal">{note}</p>}
    </div>
  );
}
