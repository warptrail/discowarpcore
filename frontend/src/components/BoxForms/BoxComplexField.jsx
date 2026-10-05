import styled from 'styled-components';

const Field = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 0;
  color: var(--dw-text);
  cursor: pointer;
  input { margin-top: 0.2rem; accent-color: var(--dw-teal); }
  input:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  strong { display: block; font-size: 0.85rem; }
`;

export default function BoxComplexField({ value = false, onChange, disabled = false }) {
  return (
    <Field>
      <input
        type="checkbox"
        role="switch"
        aria-label="Complex box"
        checked={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span><strong>Complex box</strong></span>
    </Field>
  );
}
