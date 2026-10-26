import type { ReactNode } from 'react';

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export type StepState = 'done' | 'current' | 'upcoming' | 'error';

export interface Step {
  id: string;
  title: string;
  description?: ReactNode;
  state?: StepState;
}

interface StepperProps {
  steps: readonly Step[];
  current: number;
  onStepClick?: (index: number) => void;
  label?: string;
  className?: string;
}

const stateOf = (step: Step, index: number, current: number): StepState =>
  step.state ?? (index < current ? 'done' : index === current ? 'current' : 'upcoming');

const DOT: Record<StepState, string> = {
  done: 'bg-primary border-primary text-primary-contrast',
  current: 'bg-panel border-primary text-primary ring-4 ring-primary/15',
  upcoming: 'bg-panel border-line text-muted-color',
  error: 'bg-danger-soft border-danger-line text-danger-ink',
};

const WORD: Record<StepState, string> = {
  done: 'completed',
  current: 'current step',
  upcoming: 'not started',
  error: 'has errors',
};

function Marker({ state, index }: Readonly<{ state: StepState; index: number }>) {
  return (
    <span
      aria-hidden
      className={cx(
        'text-13 relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-semibold tabular-nums',
        'transition-[background-color,border-color,color,box-shadow] duration-300 ease-[var(--ease-out-quint)]',
        DOT[state],
      )}
    >
      {state === 'done' ? (
        <i className="icon icon-check text-sm transition-[scale,opacity] duration-300 ease-[var(--ease-out-quint)] starting:scale-50 starting:opacity-0" />
      ) : state === 'error' ? (
        <i className="icon icon-circle-alert text-sm" />
      ) : (
        index + 1
      )}
    </span>
  );
}

export function Stepper({ steps, current, onStepClick, label = 'Progress', className }: Readonly<StepperProps>) {
  const safe = Math.min(Math.max(current, 0), Math.max(steps.length - 1, 0));
  const active = steps[safe];
  const percent = steps.length === 0 ? 0 : Math.round(((safe + 1) / steps.length) * 100);
  const activeState = active === undefined ? 'upcoming' : stateOf(active, safe, current);

  return (
    <nav aria-label={label} className={className}>
      <div className="flex flex-col gap-2 sm:hidden">
        <p className="text-13 flex min-w-0 items-center gap-1.5">
          <span className="text-muted-color shrink-0 tabular-nums">
            Step {safe + 1} of {steps.length}
          </span>
          <span aria-hidden className="text-muted-color">
            ·
          </span>
          <span className={cx('truncate font-medium', activeState === 'error' ? 'text-danger-ink' : 'text-color')}>{active?.title}</span>
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={safe + 1}
          aria-valuetext={`Step ${safe + 1} of ${steps.length}`}
          className="bg-sunken h-1.5 overflow-hidden rounded-full"
        >
          <span
            className={cx(
              'block h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-quint)]',
              activeState === 'error' ? 'bg-danger' : 'bg-primary',
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="hidden items-start sm:flex">
        {steps.map((step, index) => {
          const state = stateOf(step, index, current);
          const clickable = onStepClick !== undefined && state === 'done';
          const last = index === steps.length - 1;
          const content = (
            <>
              <Marker state={state} index={index} />
              <span className="flex min-w-0 flex-col items-center gap-0.5 px-1 text-center">
                <span
                  className={cx(
                    'text-13 leading-5 font-medium break-words',
                    state === 'upcoming' ? 'text-muted-color' : state === 'error' ? 'text-danger-ink' : 'text-color',
                  )}
                >
                  {step.title}
                </span>
                {step.description !== undefined && <span className="text-muted-color text-xs leading-snug">{step.description}</span>}
                <span className="sr-only">, {WORD[state]}</span>
              </span>
            </>
          );
          return (
            <li
              key={step.id}
              aria-current={state === 'current' ? 'step' : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center"
            >
              {!last && (
                <span
                  aria-hidden
                  className="bg-line absolute top-4 left-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)] -translate-y-1/2 rounded-full"
                >
                  <span
                    className={cx(
                      'bg-primary block h-full origin-left rounded-full transition-[scale] duration-500 ease-[var(--ease-out-quint)]',
                      index < current ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </span>
              )}
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className="group/step flex cursor-pointer flex-col items-center gap-2 rounded-lg p-1 [&>span:first-child]:transition-transform hover:[&>span:first-child]:scale-105"
                >
                  {content}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2 p-1">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
