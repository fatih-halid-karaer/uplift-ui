import type { ReactNode } from 'react';
import { buttonClass } from './Button';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export interface NotFoundLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

interface NotFoundProps {
  title?: string;
  message?: ReactNode;
  homeHref?: string;
  homeLabel?: string;
  backLabel?: string;
  onBack?: () => void;
  renderLink?: (props: NotFoundLinkProps) => ReactNode;
  search?: ReactNode;
  fullPage?: boolean;
  className?: string;
}

const defaultLink = ({ href, className, children }: NotFoundLinkProps) => (
  <a href={href} className={className}>
    {children}
  </a>
);

export function NotFound({
  title = 'Page not found',
  message = 'The page you are looking for was moved, removed or never existed. Check the address or head back.',
  homeHref = '/',
  homeLabel = 'Go home',
  backLabel = 'Go back',
  onBack = () => window.history.back(),
  renderLink = defaultLink,
  search,
  fullPage = true,
  className,
}: Readonly<NotFoundProps>) {
  const content = (
    <span className="inline-flex items-center gap-2">
      <i className="icon icon-house text-[0.95rem]" aria-hidden />
      {homeLabel}
    </span>
  );

  return (
    <main className={cx('bg-canvas flex items-center justify-center px-4 py-12 sm:px-6', fullPage && 'min-h-dvh', className)}>
      <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <p
          aria-hidden
          className="text-muted-color/25 text-[clamp(5.5rem,22vw,9rem)] leading-none font-bold tracking-tighter tabular-nums select-none"
        >
          404
        </p>
        <div className="-mt-2 flex flex-col gap-2">
          <h1 className="text-color text-xl font-semibold tracking-tight text-balance sm:text-2xl">{title}</h1>
          <div className="text-muted-color mx-auto max-w-[46ch] text-sm leading-relaxed text-pretty">{message}</div>
        </div>
        {search !== undefined && <div className="w-full max-w-sm">{search}</div>}
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-center">
          <button type="button" onClick={onBack} className={buttonClass({ variant: 'outlined', className: 'max-sm:w-full' })}>
            <i className="icon icon-arrow-left text-[0.95rem]" aria-hidden />
            {backLabel}
          </button>
          {renderLink({ href: homeHref, className: buttonClass({ variant: 'primary', className: 'max-sm:w-full' }), children: content })}
        </div>
      </div>
    </main>
  );
}
