import styled, { css } from 'styled-components';

const Slot = styled.div`
  height: ${({ $active, $height }) => $active ? `${$height}px` : '0'}; min-width: 0; display: flex; align-items: center;
  gap: 0.25rem; padding: ${({ $finderShelf }) => $finderShelf ? '0' : '0 0.35rem'};
  border-top: ${({ $active, $finderShelf }) => $active && !$finderShelf ? '1px solid var(--dw-border-soft)' : '0'};
  border-left: ${({ $finderShelf }) => $finderShelf ? '0' : '3px solid transparent'};
  overflow: ${({ $active, $finderShelf }) => $active && $finderShelf ? 'visible' : 'hidden'};
  transition: height 220ms ease, background-color 220ms ease, border-color 220ms ease;
  ${({ $themed, $finderShelf }) => $themed && !$finderShelf && css`
    border-color: rgba(var(--box-primary-rgb), 0.35);
    border-left-color: var(--box-primary);
    background-color: rgba(var(--box-primary-rgb), 0.08);
  `}
  @media (prefers-reduced-motion: reduce) { transition: none; }

`;
const Content = styled.div`
  flex: 1; min-width: 0; height: ${({ $height }) => `${$height}px`};
  opacity: ${({ $updating }) => $updating ? 0 : 1};
  pointer-events: ${({ $updating }) => $updating ? 'none' : 'auto'};
  transition: opacity 220ms ease;
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

// Search owns the message lifecycle. Results retain a steady height while
// typing; clearing the query gently collapses the slot completely.
export default function ConsoleMessageSlot({ message }) {
  const height = message?.height || 76;
  const finderShelf = message?.presentation === 'finder-shelf';
  const contentHeight = message?.height ? height - (finderShelf ? 4 : 8) : height;
  const inactive = !message?.active || message?.updating;
  return (
    <Slot aria-label="Console message" aria-hidden={!message?.active || undefined} data-presentation={finderShelf ? 'finder-shelf' : undefined}
      style={message?.themeStyle} $height={height} $themed={!!message?.themeStyle} $active={!!message?.active} $finderShelf={finderShelf}>
      {message ? <Content $height={contentHeight} $updating={message.updating} aria-hidden={inactive || undefined} inert={inactive || undefined}>
        {message.content}
      </Content> : null}
    </Slot>
  );
}
