import styled from 'styled-components';
import useOperationsDockGeometry from './useOperationsDockGeometry';
import { APP_VISUAL_THEME as theme } from '../../styles/tokens';

const Panel = styled.aside`
  display: none;
  @media (min-width: 1100px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: var(--operations-dock-top, 180px);
    left: var(--operations-dock-left, 0px);
    bottom: 24px;
    width: 384px;
    overflow-y: auto;
    box-sizing: border-box;
    padding: 20px;
    border: 1px solid ${theme.borderSoft};
    border-top: 3px solid ${theme.cyan};
    border-radius: var(--dw-radius-sm, 6px);
    background: ${theme.surface};
    color: ${theme.text};
    h2 { font-size: 0.95rem; margin: 0 0 28px; }
    h3 { font-size: 1.15rem; margin: 0 0 8px; }
    p { font-size: 0.85rem; line-height: 1.6; color: ${theme.textMuted}; margin: 0; }
    dl { margin: 28px 0 0; }
    dl > div { border-top: 1px solid ${theme.borderSoft}; padding: 14px 0; }
    dt { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; }
    dd { font-size: 0.8rem; line-height: 1.5; color: ${theme.textMuted}; margin: 0; }
    kbd { font: inherit; border: 1px solid ${theme.borderSoft}; border-radius: 3px; padding: 1px 4px; }
  }
`;

// Remains in the dock column beneath Quick Peek: selection never changes the
// workspace geometry, and the animated deck covers this quiet resting state.
export default function OperationsInspectorIdle({ occupied, target }) {
  const geometry = useOperationsDockGeometry(target);
  return (
    <Panel style={{ '--operations-dock-top': `${geometry.top}px`, '--operations-dock-left': `${geometry.left}px` }} data-operations-inspector-idle aria-hidden={occupied} aria-label="Inventory inspector guide">
      <h2>Inventory inspector</h2>
      <h3>Select a box</h3>
      <p>Inspect its contents, location, notes and photos here while keeping your inventory in view.</p>
      <dl>
        <div><dt>Inspect</dt><dd>Select a card to open Quick Peek.</dd></div>
        <div><dt>Explore nesting</dt><dd>Use the branch indicator beside a box ID to inspect its containment tree.</dd></div>
        <div><dt>Edit a field</dt><dd>Use the card’s field icons to open its editor directly.</dd></div>
        <div><dt>Return to inventory</dt><dd>Close the inspector or press <kbd>Esc</kbd>.</dd></div>
      </dl>
    </Panel>
  );
}
