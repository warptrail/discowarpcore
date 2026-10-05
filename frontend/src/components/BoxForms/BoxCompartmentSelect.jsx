import styled from 'styled-components';
import { getCompartments } from '../../util/boxCompartments';

const Field = styled.label`
  display: grid; gap: 0.35rem; color: var(--dw-text-secondary); font-size: 0.85rem;
  select { font: inherit; min-height: 44px; padding: 0.5rem; border: 1px solid var(--dw-border); border-radius: var(--dw-radius-sm); background: var(--dw-background); color: var(--dw-text); width: 100%; }
  select:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
`;

export default function BoxCompartmentSelect({ box, value = 'A', onChange, disabled = false }) {
  const compartments = getCompartments(box);
  if (!compartments.length) return null;
  return <Field>Compartment
    <select value={compartments.some((row) => row.key === value) ? value : 'A'} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      {compartments.map((row) => <option key={row.key} value={row.key}>{box.box_id}{row.key} · {row.label || `Compartment ${row.key}`}</option>)}
    </select>
  </Field>;
}
