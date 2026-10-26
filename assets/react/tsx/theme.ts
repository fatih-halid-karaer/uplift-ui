import { useEffect, useRef, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type Scheme = 'light' | 'dark';
export type ThemeTransition = 'sweep' | 'reveal' | 'none';

const KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export const PRE_PAINT_SCRIPT = `try{var t=localStorage.getItem('${KEY}');var d=t==='dark'||(t!=='light'&&matchMedia('${DARK_QUERY}').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}`;

function readChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function prefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

function resolve(choice: ThemeChoice): Scheme {
  if (choice === 'system') return prefersDark() ? 'dark' : 'light';
  return choice;
}

function remember(choice: ThemeChoice): boolean {
  try {
    if (choice === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
    return true;
  } catch {
    return false;
  }
}

function apply(scheme: Scheme) {
  const root = document.documentElement;
  root.dataset.theme = scheme;
  root.style.colorScheme = scheme;
}

function transitionTo(scheme: Scheme, kind: ThemeTransition, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  if (root.dataset.theme === scheme) return;
  const calm = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (kind === 'none' || calm || typeof document.startViewTransition !== 'function') {
    apply(scheme);
    return;
  }
  if (kind === 'reveal' && origin !== undefined) {
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    root.style.setProperty('--theme-x', `${origin.x}px`);
    root.style.setProperty('--theme-y', `${origin.y}px`);
    root.style.setProperty('--theme-r', `${radius}px`);
  }
  root.dataset.themeTransition = kind;
  document.startViewTransition(() => apply(scheme)).finished.finally(() => delete root.dataset.themeTransition);
}

export function useTheme(kind: ThemeTransition = 'sweep') {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice);
  const origin = useRef<{ x: number; y: number } | undefined>(undefined);
  const settled = useRef(false);

  useEffect(() => {
    const scheme = resolve(choice);
    if (settled.current) transitionTo(scheme, kind, origin.current);
    else apply(scheme);
    settled.current = true;
    remember(choice);
    if (choice !== 'system' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const follow = () => transitionTo(query.matches ? 'dark' : 'light', kind);
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, [choice, kind]);

  const setChoice = (next: ThemeChoice, from?: { x: number; y: number }) => {
    origin.current = from;
    setChoiceState(next);
  };

  return [choice, setChoice] as const;
}
