import MissingAlertLink from '../MissingItems/MissingAlertLink';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import HouseholdProfileSwitcher from '../HouseholdProfile/HouseholdProfileSwitcher';

const Rail = styled.nav`
  display: none;
  @media (min-width: 1100px) {
    position: fixed;
    inset: 16px auto 16px 16px;
    z-index: 210;
    width: 176px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    overflow-y: auto;
    background: var(--dw-surface);
    border-right: 1px solid var(--dw-border-soft);
  }
  @media (min-width: 1600px) { inset: 24px auto 24px 24px; }
`;
const Brand = styled(Link)`
  padding: 8px 4px 16px;
  color: var(--dw-text);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.35;
  text-decoration: none;
  border-bottom: 1px solid var(--dw-border-soft);
  margin-bottom: 6px;
`;
const Entry = styled(Link)`
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: var(--dw-radius-sm);
  background: transparent;
  color: var(--dw-text-secondary);
  font: 600 0.8rem/1.3 var(--dw-font-ui);
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  &[aria-current='page'] {
    color: var(--dw-cyan);
    background: var(--dw-surface-raised);
    border-color: var(--dw-border);
    box-shadow: inset 3px 0 var(--dw-cyan);
  }
  &:hover { background: var(--dw-surface-raised); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  img { width: 24px; height: 24px; object-fit: contain; flex-shrink: 0; }
`;
const ProfileSlot = styled.div`margin-top: auto; padding-top: 12px;`;

export default function DesktopNavigation({ entries, onNavigate, onHome }) {
  return (
    <Rail aria-label="Desktop primary navigation">
      <Brand to="/operations" onClick={onHome}>Disco Warp Core</Brand>
      {entries.map(({ path, label, icon, active }) => (
        <Entry key={path} to={path} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
          <img src={icon} alt="" />{label}
        </Entry>
      ))}
      <ProfileSlot><MissingAlertLink /><HouseholdProfileSwitcher /></ProfileSlot>
    </Rail>
  );
}
