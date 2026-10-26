import { useEffect, useId, useRef, useState } from 'react';
import { Drawer } from './Drawer';
import { parseSize, readStored, useMediaQuery, useResizeHandle, writeStored } from './layout';
import { Tooltip } from './Tooltip';
const cx = (...parts) => parts.filter(Boolean).join(' ');
const MIN = 208;
const MAX = 352;
const DEFAULT = 248;
const RAIL = 64;
const defaultLink = (_item, props) => <a {...props} />;
function Sidebar({ groups, activeId, renderLink, brand, brandMark, user, sidebarTop, navLabel, collapsed, onNavigate, onToggle, onClose }) {
  const baseId = useId();
  const state = { collapsed };
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cx('flex h-14 shrink-0 items-center gap-2', collapsed ? 'justify-center px-2' : 'pr-2 pl-5')}>
        <div className={cx('flex min-w-0 items-center', !collapsed && 'flex-1')}>{collapsed ? (brandMark ?? brand) : brand}</div>
        {onClose !== undefined && (
          <button
            type="button"
            data-modal-close
            aria-label="Close navigation"
            onClick={onClose}
            className="text-muted-color hover:bg-sunken hover:text-color flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150"
          >
            <i className="icon icon-x text-base" aria-hidden />
          </button>
        )}
      </div>

      {sidebarTop !== undefined && <div className="shrink-0 px-3 pb-2">{sidebarTop(state)}</div>}

      <nav
        aria-label={navLabel}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:thin]"
      >
        {groups.map((group, groupIndex) => {
          const headingId = `${baseId}-${group.id}`;
          return (
            <div key={group.id} role="group" aria-labelledby={group.label !== undefined ? headingId : undefined}>
              {group.label !== undefined && !collapsed && (
                <div className="flex items-center gap-2 px-3 pt-5 pb-1.5">
                  <span
                    id={headingId}
                    className="text-muted-color text-[0.6875rem] font-semibold tracking-wider whitespace-nowrap uppercase"
                  >
                    {group.label}
                  </span>
                  <span aria-hidden className="bg-line h-px flex-1" />
                </div>
              )}
              {group.label !== undefined && collapsed && (
                <span id={headingId} className="sr-only">
                  {group.label}
                </span>
              )}
              {collapsed && groupIndex > 0 && <span aria-hidden className="bg-line mx-auto my-3 block h-px w-6" />}
              {!collapsed && group.label === undefined && groupIndex > 0 && <span aria-hidden className="block h-4" />}
              <ul className={cx('flex flex-col gap-0.5', collapsed && groupIndex === 0 && 'pt-2')}>
                {group.items.map((item) => {
                  const active = item.id === activeId;
                  const link = renderLink(item, {
                    href: item.href,
                    'aria-current': active ? 'page' : undefined,
                    onClick: onNavigate,
                    className: cx(
                      'group/nav relative flex h-9 items-center gap-3 rounded-lg text-sm outline-none transition-colors duration-150 [@media(pointer:coarse)]:h-11',
                      'focus-visible:outline-primary focus-visible:outline-2 focus-visible:-outline-offset-2',
                      collapsed ? 'mx-auto w-10 justify-center' : 'px-3',
                      active ? 'text-color font-semibold' : 'text-muted-color hover:bg-sunken hover:text-color font-medium',
                    ),
                    children: (
                      <>
                        {active && <span aria-hidden className="bg-primary absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r-full" />}
                        <i
                          className={cx(
                            `icon icon-${item.icon} shrink-0 text-[1.05rem] transition-colors duration-150`,
                            active ? 'text-primary' : 'group-hover/nav:text-color',
                          )}
                          aria-hidden
                        />
                        <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate'}>{item.label}</span>
                        {item.badge !== undefined && !collapsed && (
                          <span className="text-muted-color text-xs font-medium tabular-nums">{item.badge}</span>
                        )}
                        {item.badge !== undefined && collapsed && (
                          <span aria-hidden className="bg-primary ring-subtle absolute top-1.5 right-1.5 size-2 rounded-full ring-2" />
                        )}
                      </>
                    ),
                  });
                  return (
                    <li key={item.id}>
                      {collapsed ? (
                        <Tooltip content={item.label} side="right" labelOnly delay={200}>
                          {link}
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {(onToggle !== undefined || user !== undefined) && (
        <div className="border-line-soft flex shrink-0 flex-col gap-1 border-t p-3">
          {onToggle !== undefined && (
            <Tooltip content={toggleLabel} side="right" labelOnly disabled={!collapsed}>
              <button
                type="button"
                aria-label={toggleLabel}
                aria-expanded={!collapsed}
                onClick={onToggle}
                className={cx(
                  'text-muted-color hover:bg-sunken hover:text-color flex h-9 cursor-pointer items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150',
                  collapsed ? 'mx-auto w-10 justify-center' : 'px-3',
                )}
              >
                <i className={`icon icon-${collapsed ? 'panel-left-open' : 'panel-left-close'} shrink-0 text-[1.05rem]`} aria-hidden />
                {!collapsed && <span className="truncate">Collapse</span>}
              </button>
            </Tooltip>
          )}
          {user?.(state)}
        </div>
      )}
    </div>
  );
}
export function AppShell({
  groups,
  activeId,
  renderLink = defaultLink,
  brand,
  brandMark,
  user,
  sidebarTop,
  topBar,
  children,
  storageKey = 'sidebar',
  fullBleed = false,
  navLabel = 'Main',
  mainId = 'main-content',
}) {
  const widthKey = `${storageKey}:width`;
  const collapsedKey = `${storageKey}:collapsed`;
  const aside = useRef(null);
  const [width, setWidth] = useState(() => readStored(widthKey, parseSize(MIN, MAX)) ?? DEFAULT);
  const [stored, setStored] = useState(() =>
    readStored(collapsedKey, (raw) => (raw === 'true' ? true : raw === 'false' ? false : undefined)),
  );
  const [drawer, setDrawer] = useState(false);
  const narrow = useMediaQuery('(max-width: 1023.98px)');
  const phone = useMediaQuery('(max-width: 767.98px)');
  const collapsed = stored ?? narrow;
  const setCollapsed = (next) => {
    setStored(next);
    writeStored(collapsedKey, String(next));
  };
  useEffect(() => {
    if (!phone) setDrawer(false);
  }, [phone]);
  const { dragging, handleProps } = useResizeHandle({
    size: width,
    min: MIN,
    max: MAX,
    label: 'Resize sidebar',
    collapsed,
    collapsedSize: RAIL,
    origin: () => aside.current?.getBoundingClientRect().left ?? 0,
    onResize: (next) => {
      setWidth(next);
      if (collapsed) setCollapsed(false);
    },
    onCommit: (next) => writeStored(widthKey, String(next)),
    onCollapse: () => setCollapsed(true),
  });
  const shared = { groups, activeId, renderLink, brand, brandMark, user, sidebarTop, navLabel };
  return (
    <div className="bg-panel flex min-h-dvh [--page-pad:1rem] [--shell-top:3.5rem] md:[--page-pad:1.5rem] md:[--shell-top:0px]">
      <a
        href={`#${mainId}`}
        className="bg-panel text-color shadow-float sr-only z-[70] rounded-lg px-3 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside
        ref={aside}
        style={{ width: collapsed ? RAIL : width }}
        className="bg-subtle border-line sticky top-0 flex h-dvh shrink-0 flex-col border-r max-md:hidden"
      >
        <Sidebar {...shared} collapsed={collapsed} onNavigate={() => {}} onToggle={() => setCollapsed(!collapsed)} />
        <div
          {...handleProps}
          className="group absolute inset-y-0 -right-1.5 z-20 flex w-3 cursor-col-resize touch-none justify-center outline-none"
        >
          <span
            className={cx(
              'h-full w-0.5 transition-colors duration-150',
              dragging ? 'bg-primary' : 'group-hover:bg-primary/40 group-focus-visible:bg-primary bg-transparent',
            )}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-panel/85 border-line sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 border-b pr-2 pl-1 backdrop-blur-md md:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
            className="text-color hover:bg-sunken flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150"
          >
            <i className="icon icon-menu text-lg" aria-hidden />
          </button>
          <div className="flex min-w-0 flex-1 items-center">{brand}</div>
          {topBar}
        </header>

        <main
          id={mainId}
          tabIndex={-1}
          className={cx(
            'min-w-0 flex-1 outline-none',
            !fullBleed && 'mx-auto w-full max-w-[1680px] p-[var(--page-pad)] pb-[calc(var(--page-pad)*2)]',
          )}
        >
          {children}
        </main>
      </div>

      <Drawer
        open={drawer && phone}
        onClose={() => setDrawer(false)}
        side="left"
        label="Navigation"
        bodyClassName="bg-subtle"
        width="w-[min(18rem,calc(100vw-3.5rem))]"
      >
        <Sidebar {...shared} collapsed={false} onNavigate={() => setDrawer(false)} onClose={() => setDrawer(false)} />
      </Drawer>
    </div>
  );
}
export function ShellUser({ name, detail, initials, collapsed, onSignOut, signOutLabel = 'Sign out' }) {
  const letters =
    initials ??
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  const badge = (
    <span
      aria-hidden
      className="bg-highlight text-highlight-ink flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
    >
      {letters}
    </span>
  );
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 pt-1">
        <Tooltip content={detail !== undefined ? `${name} · ${detail}` : name} side="right" labelOnly>
          <span role="img" aria-label={detail !== undefined ? `${name}, ${detail}` : name} className="rounded-full">
            {badge}
          </span>
        </Tooltip>
        {onSignOut !== undefined && (
          <Tooltip content={signOutLabel} side="right" labelOnly>
            <button
              type="button"
              aria-label={signOutLabel}
              onClick={onSignOut}
              className="text-muted-color hover:bg-sunken hover:text-danger flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150"
            >
              <i className="icon icon-log-out text-[1.05rem]" aria-hidden />
            </button>
          </Tooltip>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-1 pt-1">
      {badge}
      <div className="min-w-0 flex-1">
        <p className="text-color truncate text-sm font-semibold">{name}</p>
        {detail !== undefined && (
          <p className="text-muted-color truncate text-xs" title={detail}>
            {detail}
          </p>
        )}
      </div>
      {onSignOut !== undefined && (
        <button
          type="button"
          aria-label={signOutLabel}
          title={signOutLabel}
          onClick={onSignOut}
          className="text-muted-color hover:bg-sunken hover:text-danger flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150"
        >
          <i className="icon icon-log-out text-base" aria-hidden />
        </button>
      )}
    </div>
  );
}
