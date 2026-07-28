import styled from 'styled-components';

const Panel = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.65rem;
  border: 1px solid rgba(130, 168, 196, 0.28);
  border-radius: 9px;
  background: rgba(8, 15, 23, 0.55);
`;

const Label = styled.label`
  display: grid;
  gap: 0.3rem;
  color: rgba(214, 226, 241, 0.82);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Select = styled.select`
  min-height: 38px;
  border: 1px solid rgba(122, 142, 167, 0.45);
  border-radius: 7px;
  padding: 0 0.55rem;
  color: #e6edf4;
  background: #0b1018;
`;

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(214, 226, 241, 0.8);
  font-size: 0.76rem;
`;

export default function BoxDeclutterFields({
  purpose,
  setPurpose,
  isDefault,
  setIsDefault,
}) {
  const canBeDefault = purpose !== 'standard';
  return (
    <Panel>
      <Label>
        Declutter purpose
        <Select
          value={purpose}
          onChange={(event) => {
            const next = event.target.value;
            setPurpose(next);
            if (next === 'standard') setIsDefault(false);
          }}
        >
          <option value="standard">Standard inventory</option>
          <option value="donation_staging">Donation staging</option>
          <option value="sale_staging">Sale staging</option>
        </Select>
      </Label>
      <Check>
        <input
          type="checkbox"
          checked={Boolean(isDefault && canBeDefault)}
          disabled={!canBeDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
        />
        Default destination for this staging purpose
      </Check>
    </Panel>
  );
}
