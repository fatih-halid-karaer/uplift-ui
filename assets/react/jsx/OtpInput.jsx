import { useRef } from 'react';
const cx = (...parts) => parts.filter(Boolean).join(' ');
export function OtpInput({ value, onChange, onComplete, length = 6, groupAt = 3, error = false, disabled = false, label = 'Verification code', autoFocus = false, }) {
  const inputs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const hasGap = groupAt === 3 && length === 6;
  const focus = (index) => {
    const target = inputs.current[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  };
  const commit = (next) => {
    const joined = next.join('').slice(0, length);
    onChange(joined);
    if (joined.length === length && !next.includes(''))
      onComplete?.(joined);
  };
  const setDigit = (index, digit) => {
    const next = [...digits];
    next[index] = digit;
    commit(next);
    if (digit)
      focus(index + 1);
  };
  const onKeyDown = (index) => (event) => {
    if (event.key === 'Backspace' && !digits[index]) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = '';
      commit(next);
      focus(index - 1);
    }
    else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focus(index - 1);
    }
    else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focus(index + 1);
    }
  };
  const onPaste = (index) => (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted)
      return;
    event.preventDefault();
    const next = [...digits];
    pasted
      .slice(0, length - index)
      .split('')
      .forEach((digit, k) => {
      next[index + k] = digit;
    });
    commit(next);
    focus(index + pasted.length);
  };
  return (<div role="group" aria-label={label} className={cx('b-otp', hasGap && 'has-gap', error && 'is-error')} style={hasGap ? undefined : { ['--b-otp-len']: length }}>
    {digits.map((digit, i) => (<OtpCell key={i} index={i} digit={digit} length={length} showGap={hasGap && i === 3} disabled={disabled} autoFocus={autoFocus && i === 0} invalid={error} inputRef={(node) => {
        inputs.current[i] = node;
      }} onDigit={(d) => setDigit(i, d)} onKeyDown={onKeyDown(i)} onPaste={onPaste(i)}/>))}
  </div>);
}
function OtpCell({ index, digit, length, showGap, disabled, autoFocus, invalid, inputRef, onDigit, onKeyDown, onPaste }) {
  return (<>
    {showGap && <i aria-hidden="true"/>}
    <input ref={inputRef} value={digit} inputMode="numeric" pattern="[0-9]*" maxLength={1} placeholder=" " autoComplete={index === 0 ? 'one-time-code' : 'off'} autoFocus={autoFocus} disabled={disabled} aria-invalid={invalid || undefined} aria-label={`Digit ${index + 1} of ${length}`} onChange={(event) => onDigit(event.target.value.replace(/\D/g, '').slice(-1))} onKeyDown={onKeyDown} onPaste={onPaste} onFocus={(event) => event.target.select()}/>
  </>);
}
