import { useEffect, useRef, useState } from 'react';
const KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
export const PRE_PAINT_SCRIPT = `try{var t=localStorage.getItem('${KEY}');var d=t==='dark'||(t!=='light'&&matchMedia('${DARK_QUERY}').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}`;
function readChoice() {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}
function prefersDark() {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}
function resolve(choice) {
  if (choice === 'system') return prefersDark() ? 'dark' : 'light';
  return choice;
}
function remember(choice) {
  try {
    if (choice === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
    return true;
  } catch {
    return false;
  }
}
function apply(scheme) {
  const root = document.documentElement;
  root.dataset.theme = scheme;
  root.style.colorScheme = scheme;
}
function transitionTo(scheme, kind, origin) {
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
export function useTheme(kind = 'sweep') {
  const [choice, setChoiceState] = useState(readChoice);
  const origin = useRef(undefined);
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
  const setChoice = (next, from) => {
    origin.current = from;
    setChoiceState(next);
  };
  return [choice, setChoice];
}
