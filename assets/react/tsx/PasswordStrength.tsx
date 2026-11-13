import { useId } from 'react';

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const DEFAULT_RULES: PasswordRule[] = [
  { id: 'len', label: '12 or more characters', test: (v) => v.length >= 12 },
  { id: 'case', label: 'Upper and lower case', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: 'num', label: 'A number', test: (v) => /\d/.test(v) },
  { id: 'sym', label: 'A symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const;

export function scorePassword(value: string, rules: PasswordRule[] = DEFAULT_RULES) {
  const met = rules.filter((rule) => rule.test(value)).map((rule) => rule.id);
  const level = value.length === 0 ? 0 : value.length < 8 ? 1 : Math.max(1, Math.min(4, Math.round((met.length / rules.length) * 4)));
  return { level, met };
}

interface PasswordStrengthProps {
  value: string;
  rules?: PasswordRule[];
  labels?: readonly string[];
  id?: string;
  showRules?: boolean;
}

export function PasswordStrength({ value, rules = DEFAULT_RULES, labels = STRENGTH_LABELS, id, showRules = true }: PasswordStrengthProps) {
  const fallback = useId();
  const { level, met } = scorePassword(value, rules);
  return (
    <div id={id ?? fallback} className="b-strength" data-level={level}>
      <div className="b-strength-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="b-strength-text" aria-live="polite">
        <span>
          Strength: <b>{labels[level]}</b>
        </span>
      </div>
      {showRules && (
        <ul className="b-rules">
          {rules.map((rule) => (
            <li key={rule.id} className={met.includes(rule.id) ? 'is-met' : undefined}>
              {rule.label}
              <span className="sr-only">{met.includes(rule.id) ? ' (met)' : ' (not met)'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
