import React, { forwardRef, useRef } from 'react';

const DEFAULT_NAME_PREFIX = 'box_lookup';

const BoxIdPrefixInput = forwardRef(function BoxIdPrefixInput(
  {
    value = '',
    onChange,
    onFocus,
    onKeyDown,
    onPaste,
    placeholder = 'Box ID prefix',
    ariaLabel = 'Box ID prefix search',
    maxLength = 3,
    id,
    className,
    namePrefix = DEFAULT_NAME_PREFIX,
    inputAs = 'input',
    ...rest
  },
  ref
) {
  const InputTag = inputAs;
  const hardenedInputNameRef = useRef(
    `${String(namePrefix || DEFAULT_NAME_PREFIX).trim() || DEFAULT_NAME_PREFIX}_${
      Math.random().toString(36).slice(2, 10)
    }`,
  );

  return (
    <InputTag
      {...rest}
      id={id}
      ref={ref}
      className={className}
      type="search"
      name={hardenedInputNameRef.current}
      inputMode="numeric"
      enterKeyHint="search"
      pattern="[0-9]*"
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      data-lpignore="true"
      data-1p-ignore="true"
      data-bwignore="true"
    />
  );
});

export default BoxIdPrefixInput;
