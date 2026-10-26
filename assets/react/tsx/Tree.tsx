import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { Badge } from './Badge';
import { Pager, PAGE_SIZE, usePaged } from './pager';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export interface TreeNode {
  id: string;
  parentId: string | null;
  label: string;
  count?: number;
  icon?: string;
}

interface TreeProps<N extends TreeNode> {
  nodes: readonly N[];
  label: string;
  selectedId?: string | null;
  onSelect?: (node: N) => void;
  defaultExpanded?: readonly string[];
  onAdd?: (node: N) => void;
  onRename?: (node: N) => void;
  onDelete?: (node: N) => void;
  renderLabel?: (node: N) => ReactNode;
  paged?: boolean;
  pageSize?: number;
  empty?: ReactNode;
  className?: string;
}

interface Visible<N> {
  node: N;
  depth: number;
  hasChildren: boolean;
  setSize: number;
  position: number;
}

const ACTION =
  'text-muted-color hover:bg-panel hover:text-color flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors duration-150';

export function Tree<N extends TreeNode>({
  nodes,
  label,
  selectedId = null,
  onSelect,
  defaultExpanded = [],
  onAdd,
  onRename,
  onDelete,
  renderLabel,
  paged = true,
  pageSize = PAGE_SIZE,
  empty,
  className,
}: Readonly<TreeProps<N>>) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded));
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const keyboardMove = useRef(false);

  const { byId, children, roots } = useMemo(() => {
    const map = new Map<string, N>(nodes.map((node) => [node.id, node]));
    const kids = new Map<string, N[]>();
    const top: N[] = [];
    for (const node of nodes) {
      if (node.parentId === null || !map.has(node.parentId)) top.push(node);
      else {
        const list = kids.get(node.parentId) ?? [];
        list.push(node);
        kids.set(node.parentId, list);
      }
    }
    return { byId: map, children: kids, roots: top };
  }, [nodes]);

  const rootOf = (id: string | null) => {
    let current = id === null ? undefined : byId.get(id);
    const seen = new Set<string>();
    while (current !== undefined && current.parentId !== null && byId.has(current.parentId) && !seen.has(current.id)) {
      seen.add(current.id);
      current = byId.get(current.parentId);
    }
    return current;
  };

  const startRoot = rootOf(selectedId);
  const startAt = startRoot === undefined ? -1 : roots.indexOf(startRoot);
  const { rows: pageRoots, pager } = usePaged(roots, paged ? pageSize : Math.max(1, roots.length), startAt);

  const visible = useMemo(() => {
    const out: Visible<N>[] = [];
    const walk = (list: readonly N[], depth: number, trail: ReadonlySet<string>) => {
      list.forEach((node, index) => {
        const kids = children.get(node.id) ?? [];
        out.push({ node, depth, hasChildren: kids.length > 0, setSize: list.length, position: index + 1 });
        if (kids.length > 0 && expanded.has(node.id) && !trail.has(node.id)) walk(kids, depth + 1, new Set([...trail, node.id]));
      });
    };
    walk(pageRoots, 1, new Set());
    return out;
  }, [pageRoots, children, expanded]);

  const tabStop = visible.some((item) => item.node.id === focusedId)
    ? focusedId
    : visible.some((item) => item.node.id === selectedId)
      ? selectedId
      : (visible[0]?.node.id ?? null);

  useEffect(() => {
    if (!keyboardMove.current || tabStop === null) return;
    keyboardMove.current = false;
    rowRefs.current.get(tabStop)?.focus();
  }, [tabStop]);

  const setOpen = (id: string, open: boolean) =>
    setExpanded((current) => {
      if (current.has(id) === open) return current;
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });

  const moveTo = (id: string | undefined) => {
    if (id === undefined) return;
    keyboardMove.current = true;
    setFocusedId(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.target !== event.currentTarget && !(event.target instanceof HTMLLIElement)) return;
    const index = visible.findIndex((item) => item.node.id === tabStop);
    const item = visible[index];
    if (item === undefined) return;
    const { node, hasChildren } = item;
    const open = expanded.has(node.id);
    let handled = true;
    switch (event.key) {
      case 'ArrowDown':
        moveTo(visible[index + 1]?.node.id);
        break;
      case 'ArrowUp':
        moveTo(visible[index - 1]?.node.id);
        break;
      case 'Home':
        moveTo(visible[0]?.node.id);
        break;
      case 'End':
        moveTo(visible.at(-1)?.node.id);
        break;
      case 'ArrowRight':
        if (hasChildren && !open) setOpen(node.id, true);
        else if (hasChildren) moveTo(visible[index + 1]?.node.id);
        break;
      case 'ArrowLeft':
        if (hasChildren && open) setOpen(node.id, false);
        else if (node.parentId !== null && visible.some((entry) => entry.node.id === node.parentId)) moveTo(node.parentId);
        break;
      case 'Enter':
      case ' ':
        onSelect?.(node);
        break;
      case 'F2':
        if (onRename !== undefined) onRename(node);
        else handled = false;
        break;
      case 'Delete':
        if (onDelete !== undefined) onDelete(node);
        else handled = false;
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  };

  const hasActions = onAdd !== undefined || onRename !== undefined || onDelete !== undefined;

  if (nodes.length === 0)
    return <div className={className}>{empty ?? <p className="text-muted-color text-13 px-3 py-6 text-center">No items</p>}</div>;

  return (
    <div className={className}>
      <ul role="tree" aria-label={label} onKeyDown={onKeyDown} className="flex flex-col gap-px">
        {visible.map(({ node, depth, hasChildren, setSize, position }) => {
          const open = expanded.has(node.id);
          const selected = node.id === selectedId;
          const focused = node.id === tabStop;
          return (
            <li
              key={node.id}
              ref={(element) => {
                if (element === null) rowRefs.current.delete(node.id);
                else rowRefs.current.set(node.id, element);
              }}
              role="treeitem"
              aria-level={depth}
              aria-setsize={setSize}
              aria-posinset={position}
              aria-expanded={hasChildren ? open : undefined}
              aria-selected={selected}
              tabIndex={focused ? 0 : -1}
              onFocus={(event) => {
                if (event.target === event.currentTarget) setFocusedId(node.id);
              }}
              onClick={() => {
                setFocusedId(node.id);
                onSelect?.(node);
              }}
              style={{ paddingLeft: `${0.25 + (depth - 1) * 1.125}rem` }}
              className={cx(
                'group/row text-13 relative flex h-9 cursor-pointer items-center gap-1.5 rounded-lg pr-1 outline-offset-[-2px] select-none',
                'transition-colors duration-150',
                selected ? 'bg-highlight text-highlight-ink font-medium' : 'text-color hover:bg-sunken',
              )}
            >
              {hasChildren ? (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(node.id, !open);
                  }}
                  className="text-muted-color hover:text-color flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md"
                >
                  <i
                    className={cx(
                      'icon icon-chevron-right text-xs transition-transform duration-200 ease-[var(--ease-out-quint)]',
                      open && 'rotate-90',
                    )}
                  />
                </button>
              ) : (
                <span aria-hidden className="size-6 shrink-0" />
              )}
              <i
                aria-hidden
                className={cx(
                  'icon shrink-0 text-sm',
                  `icon-${node.icon ?? (hasChildren && open ? 'folder-open' : 'folder')}`,
                  selected ? 'text-primary' : 'text-muted-color',
                )}
              />
              <span className="min-w-0 flex-1 truncate">{renderLabel?.(node) ?? node.label}</span>
              {node.count !== undefined && <Badge count={node.count} tone="neutral" label={`${node.count} items`} />}
              {hasActions && (
                <span
                  className={cx(
                    'flex shrink-0 items-center transition-opacity duration-150',
                    selected
                      ? 'opacity-100'
                      : 'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100',
                  )}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  {onAdd !== undefined && (
                    <button
                      type="button"
                      tabIndex={focused ? 0 : -1}
                      aria-label={`Add inside ${node.label}`}
                      onClick={() => onAdd(node)}
                      className={ACTION}
                    >
                      <i className="icon icon-plus text-xs" aria-hidden />
                    </button>
                  )}
                  {onRename !== undefined && (
                    <button
                      type="button"
                      tabIndex={focused ? 0 : -1}
                      aria-label={`Rename ${node.label}`}
                      onClick={() => onRename(node)}
                      className={ACTION}
                    >
                      <i className="icon icon-pencil text-xs" aria-hidden />
                    </button>
                  )}
                  {onDelete !== undefined && (
                    <button
                      type="button"
                      tabIndex={focused ? 0 : -1}
                      aria-label={`Delete ${node.label}`}
                      onClick={() => onDelete(node)}
                      className={cx(ACTION, 'hover:text-danger-ink')}
                    >
                      <i className="icon icon-trash-2 text-xs" aria-hidden />
                    </button>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {paged && <Pager {...pager} />}
    </div>
  );
}
