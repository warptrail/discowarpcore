import styled from 'styled-components';

const Panel = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: ${({ $compact }) => ($compact ? '7px 0 0' : '0.65rem')};
  border: ${({ $compact }) =>
    $compact ? '0' : '1px solid rgba(130, 168, 196, 0.28)'};
  border-top: ${({ $compact }) =>
    $compact ? '1px solid rgba(151, 163, 176, 0.24)' : undefined};
  border-radius: ${({ $compact }) => ($compact ? '0' : '9px')};
  background: ${({ $compact }) => ($compact ? 'transparent' : 'rgba(8, 15, 23, 0.55)')};
`;

const Label = styled.div`
  display: grid;
  gap: 0.3rem;
  color: rgba(214, 226, 241, 0.82);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const FlagGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.35rem;

  @media (max-width: 390px) {
    gap: 0.25rem;
  }
`;

const Flag = styled.button`
  display: grid;
  grid-template-columns: 7px minmax(0, 1fr);
  align-items: center;
  gap: 0.55rem;
  min-height: 46px;
  padding: 0.45rem 0.55rem;
  border: 1px solid ${({ $active, $tone }) =>
    $active ? $tone : 'rgba(122, 142, 167, 0.22)'};
  border-radius: 7px;
  color: ${({ $active }) => ($active ? '#f2f7fa' : 'rgba(214, 226, 241, 0.66)')};
  background: ${({ $active, $tone }) =>
    $active ? `linear-gradient(100deg, ${$tone}24, rgba(8, 15, 23, 0.74))` : 'rgba(8, 15, 23, 0.42)'};
  text-align: left;
  cursor: pointer;
  box-shadow: ${({ $active, $tone }) => ($active ? `inset 0 0 0 1px ${$tone}18` : 'none')};

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.66);
    outline-offset: 2px;
  }
`;

const FlagLight = styled.span`
  width: 6px;
  height: 18px;
  border-radius: 2px;
  background: ${({ $active, $tone }) => ($active ? $tone : 'rgba(154, 171, 187, 0.24)')};
  box-shadow: ${({ $active, $tone }) => ($active ? `0 0 9px ${$tone}88` : 'none')};
`;

const FlagText = styled.span`
  display: grid;
  gap: 0.12rem;
  min-width: 0;
`;

const FlagTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 760;
  letter-spacing: 0.015em;
  text-transform: none;
`;

const FlagHint = styled.span`
  color: rgba(184, 202, 212, 0.48);
  font: 600 0.58rem/1.2 ui-monospace, monospace;
  letter-spacing: 0.02em;
  text-transform: none;
`;

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(214, 226, 241, 0.8);
  font-size: 0.76rem;
`;

export default function BoxDeclutterFields({
  compact = false,
  purpose,
  setPurpose,
  isDefault,
  setIsDefault,
  isGiftBox,
  setIsGiftBox,
}) {
  const canBeDefault = purpose !== 'standard';
  const flags = [
    { value: 'standard', title: 'Standard inventory', hint: 'Keep and retrieve', tone: '#4cc6c1' },
    { value: 'donation_staging', title: 'Donation staging', hint: 'Route to donate', tone: '#a78bfa' },
    { value: 'sale_staging', title: 'Sale staging', hint: 'Route to sell', tone: '#e8b15c' },
    { value: 'gift_staging', title: 'Gift staging', hint: 'Route to handoff', tone: '#f09ab8' },
    { value: 'discard_staging', title: 'Trash staging', hint: 'Route to discard', tone: '#f08a7b' },
  ];
  return (
    <Panel $compact={compact}>
      <Label>
        Declutter purpose
        <FlagGrid role="radiogroup" aria-label="Declutter purpose">
          {flags.map((flag) => {
            const active = purpose === flag.value;
            return (
              <Flag
                key={flag.value}
                type="button"
                role="radio"
                aria-checked={active}
                $active={active}
                $tone={flag.tone}
                onClick={() => {
                  setPurpose(flag.value);
                  if (flag.value === 'standard') setIsDefault(false);
                }}
              >
                <FlagLight aria-hidden="true" $active={active} $tone={flag.tone} />
                <FlagText>
                  <FlagTitle>{flag.title}</FlagTitle>
                  <FlagHint>{flag.hint}</FlagHint>
                </FlagText>
              </Flag>
            );
          })}
        </FlagGrid>
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
      <Check>
        <input
          type="checkbox"
          checked={Boolean(isGiftBox)}
          onChange={(event) => setIsGiftBox(event.target.checked)}
        />
        Future gift box — contents stay in inventory for friends or family
      </Check>
    </Panel>
  );
}
