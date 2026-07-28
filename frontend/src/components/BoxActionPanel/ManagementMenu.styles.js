import styled from 'styled-components';

export const Menu = styled.section`
  display: grid;
  gap: 10px;
`;
export const MenuIntro = styled.p`
  margin: 0 2px 2px;
  color: rgba(226, 234, 242, 0.62);
  font-size: 0.78rem;
`;
export const ActionList = styled.div`
  display: grid;
  gap: 6px;
`;
export const ActionRow = styled.button`
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-height: 52px;
  padding: 7px 9px;
  border: 1px solid ${({ $danger }) => ($danger ? 'rgba(240, 138, 123, .22)' : 'rgba(127, 215, 255, .16)')};
  border-radius: 10px;
  color: #edf3f7;
  text-align: left;
  background: ${({ $danger }) => ($danger ? 'rgba(88, 25, 25, .18)' : 'rgba(255,255,255,.035)')};
  cursor: pointer;
  transition: 160ms ease;

  &:hover, &:focus-visible {
    border-color: ${({ $danger }) => ($danger ? 'rgba(240, 138, 123, .62)' : 'rgba(76, 198, 193, .62)')};
    background: ${({ $danger }) => ($danger ? 'rgba(100, 28, 28, .3)' : 'rgba(76, 198, 193, .1)')};
    outline: none;
  }
  &:disabled { opacity: .58; cursor: wait; }
`;
export const ActionIcon = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: rgba(127, 215, 255, .9);
  background: rgba(127, 215, 255, .08);
  font: 800 .92rem/1 ui-monospace, monospace;
`;
export const ActionCopy = styled.span` display: grid; gap: 2px; min-width: 0; `;
export const ActionTitle = styled.span` font-weight: 760; font-size: .84rem; `;
export const ActionDescription = styled.span`
  overflow: hidden;
  color: rgba(226, 234, 242, .56);
  font-size: .7rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const ActionChevron = styled.span` color: rgba(226,234,242,.48); font-size: 1.35rem; `;
