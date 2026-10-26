import { Fragment, type ReactElement, type ReactNode } from 'react';

import { DropdownMenu } from './DropdownMenu';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export interface Crumb {
  label: string;
  href?: string;
  icon?: string;
}

export interface CrumbLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

interface BreadcrumbsProps {
  items: readonly Crumb[];
  renderLink?: (crumb: Crumb, props: CrumbLinkProps) => ReactElement;
  onNavigate?: (href: string) => void;
  max?: number;
  label?: string;
  moreLabel?: string;
  className?: string;
}

const LINK =
  'text-muted-color hover:text-color flex min-w-0 items-center gap-1.5 rounded-sm truncate transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function Separator() {
  return <i aria-hidden className="icon icon-chevron-right text-muted-color/70 shrink-0 text-xs" />;
}

export function Breadcrumbs({
  items,
  renderLink = (_crumb, props) => <a {...props} />,
  onNavigate = (href) => window.location.assign(href),
  max = 4,
  label = 'Breadcrumb',
  moreLabel = 'Show hidden path',
  className,
}: Readonly<BreadcrumbsProps>) {
  const count = items.length;
  const limit = Math.max(2, max);
  const phoneHidden = count > 2 ? items.slice(1, count - 1) : [];
  const wideHiddenCount = count > limit ? count - limit : 0;
  const wideHidden = items.slice(1, 1 + wideHiddenCount);

  const more = (hidden: readonly Crumb[], visibility: string) => (
    <li className={cx('flex shrink-0 items-center gap-1.5', visibility)}>
      <Separator />
      <DropdownMenu
        label={moreLabel}
        items={hidden.map((crumb, index) => ({
          id: `${index}-${crumb.label}`,
          label: crumb.label,
          icon: crumb.icon ?? 'corner-down-right',
          disabled: crumb.href === undefined,
          onSelect: () => {
            if (crumb.href !== undefined) onNavigate(crumb.href);
          },
        }))}
        trigger={(props) => (
          <button
            {...props}
            type="button"
            aria-label={moreLabel}
            title={moreLabel}
            className="text-muted-color hover:bg-sunken hover:text-color aria-expanded:bg-sunken flex h-6 min-w-7 cursor-pointer items-center justify-center rounded-md transition-colors duration-150"
          >
            <i className="icon icon-ellipsis text-sm" aria-hidden />
          </button>
        )}
      />
    </li>
  );

  return (
    <nav aria-label={label} className={cx('min-w-0', className)}>
      <ol className="text-13 flex min-w-0 items-center gap-1.5">
        {items.map((crumb, index) => {
          const last = index === count - 1;
          const hiddenWide = index >= 1 && index <= wideHiddenCount;
          const hiddenPhone = index > 0 && !last;
          const body = (
            <>
              {crumb.icon !== undefined && <i className={`icon icon-${crumb.icon} shrink-0 text-sm`} aria-hidden />}
              <span className="truncate">{crumb.label}</span>
            </>
          );
          return (
            <Fragment key={`${index}-${crumb.label}`}>
              <li
                className={cx(
                  'flex min-w-0 items-center gap-1.5',
                  hiddenWide ? 'hidden' : hiddenPhone && 'max-sm:hidden',
                  index === 0 && !last ? 'max-w-[40%] shrink sm:max-w-[14rem]' : last ? 'shrink' : 'max-w-[14rem] shrink-[2]',
                )}
              >
                {index > 0 && <Separator />}
                {last || crumb.href === undefined ? (
                  <span
                    aria-current={last ? 'page' : undefined}
                    className={cx('flex min-w-0 items-center gap-1.5', last ? 'text-color font-medium' : 'text-muted-color')}
                  >
                    {body}
                  </span>
                ) : (
                  renderLink(crumb, { href: crumb.href, className: LINK, children: body })
                )}
              </li>
              {index === 0 && phoneHidden.length > 0 && more(phoneHidden, 'sm:hidden')}
              {index === 0 && wideHidden.length > 0 && more(wideHidden, 'max-sm:hidden')}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
