import styled, { css } from 'styled-components';
import { ITEM_OWNERS } from '../../util/itemOwners';
import OwnerSymbol from '../OperationsFilters/OwnerSymbol';
import { useHouseholdProfile } from './HouseholdProfileContext';

const Panel = styled.section`
  min-width: 0; padding: 8px 3px;
  color: var(--dw-text-secondary); font: 400 .75rem/1.4 var(--dw-font-ui);
  ${({ $compact }) => $compact && css`padding: 0; border: 0; flex-shrink: 0;`}
`;
const Status = styled.div`margin-bottom: 6px;`;
const Choices = styled.div`
  display: flex; gap: ${({ $compact }) => $compact ? '0' : '4px'};
  @media (min-width: 1100px) { flex-direction: ${({ $compact }) => $compact ? 'row' : 'column'}; }
`;
const Choice = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 7px;
  flex: 1; min-width: 0; min-height: 44px; padding: 4px 8px;
  border: 1px solid var(--dw-border-soft); border-radius: 8px;
  background: var(--dw-background); color: ${({ $accent }) => $accent};
  font: 500 .8rem/1.2 var(--dw-font-ui); cursor: pointer;
  svg { width: 20px; height: 20px; flex-shrink: 0; }
  &[aria-pressed='true'] { background:color-mix(in srgb,currentColor 8%,var(--dw-background)); border-color: currentColor; box-shadow: inset 0 -2px 0 currentColor; }
  &:hover { border-color: currentColor; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  &:disabled { opacity: .4; cursor: default; }
  ${({ $compact }) => $compact && css`
    flex: 0 0 44px; width: 44px; padding: 0; border: 0; background: transparent;
    svg { width: 22px; height: 22px; }
    &[aria-pressed='true'] { background: var(--dw-surface-raised); }
  `}
`;
export default function HouseholdProfileSwitcher({ compact = false }) {
  const { profileId, profile, selectProfile } = useHouseholdProfile();
  const status = profile ? `Using ${profile.label}` : 'Choose your profile';
  return (
    <Panel $compact={compact} aria-label="Device profile"
      aria-description={compact ? status : undefined}
      title={compact ? status : undefined}>
      {compact ? null : <Status>{status}</Status>}
      <Choices $compact={compact} role="group" aria-label="Choose household profile">
        {ITEM_OWNERS.map((entry) => (
          <Choice key={entry.id} type="button" $accent={entry.accent} $compact={compact}
            aria-label={`Use ${entry.label} on this device`} aria-pressed={profileId === entry.id}
            title={profileId===entry.id ? `Sign out of ${entry.label}` : `Use ${entry.label} on this device`} onClick={() => selectProfile(profileId===entry.id ? '' : entry.id)}>
            <OwnerSymbol owner={entry.id} />{compact ? null : entry.label}
          </Choice>
        ))}
      </Choices>
    </Panel>
  );
}
