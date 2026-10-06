import styled, { css } from 'styled-components';

const Slot = styled.div`
  height: ${({ $active }) => $active ? '76px' : '28px'}; min-width: 0; display: flex; align-items: center;
  gap: 0.25rem; padding: 0 0.35rem;
  border-top: 1px solid var(--dw-border-soft);
  border-left: 3px solid transparent;
  overflow: hidden;
  transition: height 220ms ease, background-color 220ms ease, border-color 220ms ease;
  ${({ $themed }) => $themed && css`
    border-color: rgba(var(--box-primary-rgb), 0.35);
    border-left-color: var(--box-primary);
    background-color: rgba(var(--box-primary-rgb), 0.08);
  `}
  @media (prefers-reduced-motion: reduce) { transition: none; }

`;
const Idle = styled.span`
  color: var(--dw-text-muted); font-size: 0.75rem;
`;
const Content = styled.div`
  flex: 1; min-width: 0; height: 76px;
  opacity: ${({ $updating }) => $updating ? 0 : 1};
  pointer-events: ${({ $updating }) => $updating ? 'none' : 'auto'};
  transition: opacity 220ms ease;
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

// Search owns the message lifecycle. Results retain a steady height while
// typing; clearing the query gently returns the console to its compact idle row.
export default function ConsoleMessageSlot({ message }) {
  return (
    <Slot aria-label="Console message" style={message?.themeStyle} $themed={!!message?.themeStyle} $active={!!message?.active}>
      {message ? <Content $updating={message.updating} aria-hidden={message.updating || undefined} inert={message.updating || undefined}>
        {message.content}
      </Content> : <Idle>Search to see an item’s box and location.</Idle>}
    </Slot>
  );
}
