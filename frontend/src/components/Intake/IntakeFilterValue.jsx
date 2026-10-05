import { inputStyles } from '../../styles/primitives';
import { useId, useState } from 'react';
import styled from 'styled-components';
import { SelectWrap, SelectMenu, SelectOption } from '../../styles/CustomSelect.styles';

const Input = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 44px;
  box-sizing: border-box;
  border: 0;
  border-radius: 0;
  padding: 0 0.5rem;
  background: var(--dw-surface);
  color: var(--dw-text);
  font: inherit;
  font-size: 0.7rem;
  appearance: none;

  &::placeholder { color: var(--dw-text-muted); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }

  ${inputStyles}
`;

export default function IntakeFilterValue({ suggestions, value, onChange, type, ...props }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = suggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(value.toLowerCase()),
  );
  const expanded = open && matches.length > 0 && type !== 'number';
  const choose = (nextValue) => {
    onChange({ target: { value: nextValue } });
    setOpen(false);
    setActive(-1);
  };

  return (
    <SelectWrap $open={expanded} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <Input
        {...props}
        type={type === 'number' ? 'number' : 'text'}
        value={value}
        role={type === 'number' ? undefined : 'combobox'}
        aria-autocomplete={type === 'number' ? undefined : 'list'}
        aria-expanded={type === 'number' ? undefined : expanded}
        aria-controls={expanded ? id : undefined}
        aria-activedescendant={expanded && active >= 0 ? `${id}-${active}` : undefined}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => { onChange(event); setOpen(true); setActive(-1); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { setOpen(false); setActive(-1); }
          if (type === 'number' || !matches.length) return;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setActive((previous) => previous < 0
              ? event.key === 'ArrowDown' ? 0 : matches.length - 1
              : (previous + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length);
          }
          if (event.key === 'Enter' && expanded && active >= 0) {
            event.preventDefault();
            choose(matches[active]);
          }
        }}
      />
      {expanded ? (
        <SelectMenu id={id} role="listbox" aria-label="Filter value suggestions">
          {matches.map((suggestion, index) => (
            <SelectOption
              key={suggestion}
              id={`${id}-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={suggestion === value}
              $selected={suggestion === value}
              $active={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(suggestion)}
            >
              {suggestion}
            </SelectOption>
          ))}
        </SelectMenu>
      ) : null}
    </SelectWrap>
  );
}
