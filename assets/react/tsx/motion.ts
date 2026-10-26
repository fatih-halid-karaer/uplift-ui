import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { flushSync } from 'react-dom';

const calm = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useLeave(open: boolean, exitMs = 160) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const timer = setTimeout(
      () => {
        setMounted(false);
        setLeaving(false);
      },
      calm() ? 0 : exitMs,
    );
    return () => clearTimeout(timer);
  }, [open, mounted, exitMs]);

  return { mounted, leaving };
}

export function useCountUp(target: number, durationMs = 620) {
  const [value, setValue] = useState(calm() ? target : 0);
  const from = useRef(0);

  useEffect(() => {
    if (calm()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(origin + (target - origin) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

export function useSlidingIndicator(container: RefObject<HTMLElement | null>, activeSelector: string, deps: readonly unknown[]) {
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 });

  useLayoutEffect(() => {
    const root = container.current;
    if (root === null) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>(activeSelector);
      if (active === null) {
        setStyle({ opacity: 0 });
        return;
      }
      setStyle({
        opacity: 1,
        width: active.offsetWidth,
        height: active.offsetHeight,
        transform: `translate(${active.offsetLeft}px, ${active.offsetTop}px)`,
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, deps);

  return style;
}

export function useSettled(ref: RefObject<HTMLElement | null>, key: unknown, afterMs = 450) {
  useEffect(() => {
    const node = ref.current;
    if (node === null) return;
    node.classList.remove('is-settled');
    const timer = setTimeout(() => node.classList.add('is-settled'), afterMs);
    return () => clearTimeout(timer);
  }, [ref, key, afterMs]);
}

export function spotlight(event: { currentTarget: HTMLElement; clientX: number; clientY: number }) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty('--my', `${event.clientY - box.top}px`);
}

export function pressFlash(node: HTMLElement | null) {
  if (node === null) return;
  node.classList.remove('is-pressed');
  void node.offsetWidth;
  node.classList.add('is-pressed');
  setTimeout(() => node.classList.remove('is-pressed'), 130);
}

export function routeTransition(update: () => void) {
  if (calm() || typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  document.startViewTransition(update);
}

type PointerLike = { currentTarget: HTMLElement; clientX: number; clientY: number };

const supports = (rule: string) => typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports(rule);

export function useReveal(container: RefObject<HTMLElement | null>, selector = '.m-reveal', deps: readonly unknown[] = []) {
  useEffect(() => {
    const root = container.current;
    if (root === null || calm() || supports('animation-timeline: view()') || typeof IntersectionObserver === 'undefined') return;
    const nodes = [...(root.matches(selector) ? [root] : []), ...root.querySelectorAll<HTMLElement>(selector)];
    nodes.forEach((node, index) => {
      node.classList.add('is-pending');
      if (node.style.getPropertyValue('--i') === '') node.style.setProperty('--i', String(index % 4));
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-inview');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      nodes.forEach((node) => node.classList.remove('is-pending', 'is-inview'));
    };
  }, [container, selector, ...deps]);
}

export function useScrollProgress(bar: RefObject<HTMLElement | null>, scroller?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = bar.current;
    if (node === null || supports('animation-timeline: scroll()')) return;
    const source = scroller?.current ?? null;
    const target: HTMLElement | Window = source ?? window;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = source ?? document.documentElement;
      const max = box.scrollHeight - box.clientHeight;
      node.style.setProperty('--m-progress', String(max > 0 ? Math.min(1, box.scrollTop / max) : 0));
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [bar, scroller]);
}

export function useScrolled(threshold = 8, scroller?: RefObject<HTMLElement | null>) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const source = scroller?.current ?? null;
    const target: HTMLElement | Window = source ?? window;
    const read = () => setScrolled((source ?? document.documentElement).scrollTop > threshold);
    read();
    target.addEventListener('scroll', read, { passive: true });
    return () => target.removeEventListener('scroll', read);
  }, [threshold, scroller]);

  return scrolled;
}

export function morphTransition(from: HTMLElement | null, name: string, update: () => void, to?: () => HTMLElement | null) {
  if (calm() || typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  from?.style.setProperty('view-transition-name', name);
  let target: HTMLElement | null = null;
  const transition = document.startViewTransition(() => {
    from?.style.removeProperty('view-transition-name');
    flushSync(update);
    target = to?.() ?? null;
    target?.style.setProperty('view-transition-name', name);
  });
  void transition.finished.finally(() => target?.style.removeProperty('view-transition-name'));
}

export function splitText(text: string, by: 'letters' | 'words' = 'letters') {
  const parts = by === 'words' ? text.split(/(\s+)/).filter((part) => part !== '') : Array.from(text);
  let index = 0;
  return parts.map((part, key) => {
    const style = { '--i': String(index) } as CSSProperties;
    if (part.trim() !== '') index += 1;
    return { key, text: part, style };
  });
}

export function useTypewriter(text: string, msPerChar = 40, delayMs = 0) {
  const [count, setCount] = useState(calm() ? text.length : 0);

  useEffect(() => {
    if (calm()) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let interval = 0;
    const timer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((current) => {
          if (current + 1 >= text.length) window.clearInterval(interval);
          return Math.min(text.length, current + 1);
        });
      }, msPerChar);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [text, msPerChar, delayMs]);

  return { shown: text.slice(0, count), done: count >= text.length };
}

const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?';

export function scrambleFrames(text: string, onFrame: (value: string) => void, durationMs = 640) {
  if (calm()) {
    onFrame(text);
    return () => undefined;
  }
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    const fixed = Math.floor(text.length * t);
    let out = text.slice(0, fixed);
    for (let i = fixed; i < text.length; i += 1) {
      const char = text.charAt(i);
      out += char.trim() === '' ? char : glyphs.charAt(Math.floor(Math.random() * glyphs.length));
    }
    onFrame(out);
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

export function scramble(node: HTMLElement | null, text: string, durationMs = 640) {
  if (node === null) return () => undefined;
  node.setAttribute('aria-label', text);
  return scrambleFrames(
    text,
    (value) => {
      node.textContent = value;
    },
    durationMs,
  );
}

export function useScramble(text: string, durationMs = 640) {
  const [value, setValue] = useState(text);

  useEffect(() => scrambleFrames(text, setValue, durationMs), [text, durationMs]);

  return value;
}

export function odometer(node: HTMLElement | null, value: number, format: (value: number) => string = (n) => n.toLocaleString()) {
  if (node === null) return;
  const text = format(value);
  node.setAttribute('aria-label', text);
  const shape = text.replace(/\d/g, '0');
  if (node.dataset.shape !== shape) {
    node.dataset.shape = shape;
    node.replaceChildren(
      ...Array.from(text).map((char) => {
        const cell = document.createElement('span');
        cell.setAttribute('aria-hidden', 'true');
        if (!/\d/.test(char)) {
          cell.textContent = char;
          return cell;
        }
        cell.className = 'm-odometer-digit';
        const reel = document.createElement('span');
        reel.className = 'm-odometer-reel';
        for (let digit = 0; digit < 10; digit += 1) {
          const face = document.createElement('span');
          face.textContent = String(digit);
          reel.appendChild(face);
        }
        cell.appendChild(reel);
        return cell;
      }),
    );
    void node.offsetWidth;
  }
  const reels = node.querySelectorAll<HTMLElement>('.m-odometer-reel');
  const digits = text.replace(/\D/g, '');
  reels.forEach((reel, index) => {
    reel.style.setProperty('--i', String(reels.length - 1 - index));
    reel.style.setProperty('--d', digits.charAt(index));
  });
}

export function ripple(event: PointerLike) {
  if (calm()) return;
  const host = event.currentTarget;
  const box = host.getBoundingClientRect();
  const keyboard = event.clientX === 0 && event.clientY === 0;
  const x = keyboard ? box.width / 2 : event.clientX - box.left;
  const y = keyboard ? box.height / 2 : event.clientY - box.top;
  const size = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) * 2;
  const wave = document.createElement('span');
  wave.className = 'm-ripple-wave';
  wave.setAttribute('aria-hidden', 'true');
  wave.style.setProperty('--m-x', `${x}px`);
  wave.style.setProperty('--m-y', `${y}px`);
  wave.style.setProperty('--m-size', `${size}px`);
  wave.addEventListener('animationend', () => wave.remove(), { once: true });
  host.appendChild(wave);
}

export function magnetic(event: PointerLike, strength = 0.3) {
  if (calm()) return;
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--m-tx', `${(event.clientX - box.left - box.width / 2) * strength}px`);
  event.currentTarget.style.setProperty('--m-ty', `${(event.clientY - box.top - box.height / 2) * strength}px`);
}

export function magneticReset(event: { currentTarget: HTMLElement }) {
  event.currentTarget.style.removeProperty('--m-tx');
  event.currentTarget.style.removeProperty('--m-ty');
}

export function tilt(event: PointerLike, maxDeg = 8) {
  if (calm()) return;
  const node = event.currentTarget;
  const box = node.getBoundingClientRect();
  const px = (event.clientX - box.left) / box.width;
  const py = (event.clientY - box.top) / box.height;
  node.classList.add('is-tilting');
  node.style.setProperty('--m-rx', `${(0.5 - py) * maxDeg * 2}deg`);
  node.style.setProperty('--m-ry', `${(px - 0.5) * maxDeg * 2}deg`);
  node.style.setProperty('--mx', `${event.clientX - box.left}px`);
  node.style.setProperty('--my', `${event.clientY - box.top}px`);
}

export function tiltReset(event: { currentTarget: HTMLElement }) {
  const node = event.currentTarget;
  node.classList.remove('is-tilting');
  node.style.removeProperty('--m-rx');
  node.style.removeProperty('--m-ry');
}

const burstColors = [
  'var(--primary, #1b4a9e)',
  'var(--success, #16a34a)',
  'var(--warn, #d97706)',
  'var(--info, #0284c7)',
  'var(--danger, #dc2626)',
];

export function burst(origin: HTMLElement | { x: number; y: number } | null, count = 18) {
  if (origin === null || calm()) return;
  let point = { x: 0, y: 0 };
  if (origin instanceof HTMLElement) {
    const box = origin.getBoundingClientRect();
    point = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  } else {
    point = origin;
  }
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const distance = 40 + Math.random() * 50;
    const bit = document.createElement('span');
    bit.className = 'm-confetti-bit';
    bit.setAttribute('aria-hidden', 'true');
    bit.style.setProperty('--m-x', `${point.x}px`);
    bit.style.setProperty('--m-y', `${point.y}px`);
    bit.style.setProperty('--m-dx', `${Math.cos(angle) * distance}px`);
    bit.style.setProperty('--m-dy', `${Math.sin(angle) * distance - 24}px`);
    bit.style.setProperty('--m-rot', `${Math.round(Math.random() * 720 - 360)}deg`);
    bit.style.setProperty('--m-color', burstColors[i % burstColors.length] ?? 'currentColor');
    bit.addEventListener('animationend', () => bit.remove(), { once: true });
    document.body.appendChild(bit);
  }
}

export function useTimedFlag(ms = 1600) {
  const [flag, setFlag] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const trigger = useCallback(() => {
    clearTimeout(timer.current);
    setFlag(true);
    timer.current = setTimeout(() => setFlag(false), ms);
  }, [ms]);

  return [flag, trigger] as const;
}

type FlipBox = { x: number; y: number };

const flipBoxes = (root: HTMLElement) => {
  const origin = root.getBoundingClientRect();
  const boxes = new Map<string, { node: HTMLElement; box: FlipBox }>();
  root.querySelectorAll<HTMLElement>('[data-flip-key]').forEach((node) => {
    const rect = node.getBoundingClientRect();
    boxes.set(node.dataset.flipKey ?? '', { node, box: { x: rect.left - origin.left, y: rect.top - origin.top } });
  });
  return boxes;
};

const playFlip = (node: HTMLElement, from: FlipBox, to: FlipBox, ms: number) => {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
    duration: ms,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  });
};

export function flip(root: HTMLElement | null, mutate: () => void, ms = 320) {
  if (root === null || calm()) {
    mutate();
    return;
  }
  const before = flipBoxes(root);
  mutate();
  flipBoxes(root).forEach(({ node, box }, key) => {
    const from = before.get(key);
    if (from !== undefined) playFlip(node, from.box, box, ms);
  });
}

export function useFlip(container: RefObject<HTMLElement | null>, deps: readonly unknown[], ms = 320) {
  const last = useRef(new Map<string, FlipBox>());

  useLayoutEffect(() => {
    const root = container.current;
    if (root === null) return;
    const next = new Map<string, FlipBox>();
    flipBoxes(root).forEach(({ node, box }, key) => {
      next.set(key, box);
      const from = last.current.get(key);
      if (from !== undefined && !calm()) playFlip(node, from, box, ms);
    });
    last.current = next;
  }, deps);
}

export function gridStagger(root: HTMLElement | null) {
  if (root === null) return;
  const items = Array.from(root.children).filter((node): node is HTMLElement => node instanceof HTMLElement);
  const rows = [...new Set(items.map((node) => node.offsetTop))].sort((a, b) => a - b);
  const cols = [...new Set(items.map((node) => node.offsetLeft))].sort((a, b) => a - b);
  items.forEach((node) => {
    node.style.setProperty('--row', String(rows.indexOf(node.offsetTop)));
    node.style.setProperty('--col', String(cols.indexOf(node.offsetLeft)));
  });
}

export function originFrom(trigger: HTMLElement | null, panel: HTMLElement | null) {
  if (trigger === null || panel === null) return;
  const t = trigger.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  const x = Math.min(Math.max(t.left + t.width / 2 - p.left, 0), p.width);
  const y = Math.min(Math.max(t.top + t.height / 2 - p.top, 0), p.height);
  panel.style.setProperty('--m-origin', `${x}px ${y}px`);
}

export function placeAtPointer(event: { clientX: number; clientY: number }, panel: HTMLElement | null, gap = 4) {
  if (panel === null) return;
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  const flipX = event.clientX + width + gap > window.innerWidth;
  const flipY = event.clientY + height + gap > window.innerHeight;
  panel.style.left = `${flipX ? Math.max(gap, event.clientX - width) : event.clientX}px`;
  panel.style.top = `${flipY ? Math.max(gap, event.clientY - height) : event.clientY}px`;
  panel.style.setProperty('--m-origin', `${flipX ? 'right' : 'left'} ${flipY ? 'bottom' : 'top'}`);
}
