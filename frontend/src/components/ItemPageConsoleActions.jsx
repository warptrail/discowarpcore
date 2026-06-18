import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_XS,
} from '../styles/tokens';

const Wrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(0.7rem - (0.18rem * var(--toast-compact-progress, 0)));
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: stretch;
    gap: 0.5rem;
    flex-direction: column;
  }
`;

const Meta = styled.div`
  display: grid;
  gap: 0.12rem;
  min-width: 0;
`;

const Kicker = styled.span`
  color: rgba(159, 224, 255, 0.82);
  font-size: calc(0.64rem - (0.04rem * var(--toast-compact-progress, 0)));
  font-weight: 760;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;

const Name = styled.span`
  color: rgba(234, 244, 255, 0.96);
  font-size: calc(0.94rem - (0.1rem * var(--toast-compact-progress, 0)));
  font-weight: 760;
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    white-space: normal;
    overflow-wrap: anywhere;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.24rem;
  flex: 0 0 auto;
  padding: 0.22rem;
  border: 1px solid rgba(91, 215, 244, 0.24);
  border-radius: 11px;
  background:
    linear-gradient(180deg, rgba(19, 32, 48, 0.88), rgba(8, 13, 23, 0.86)),
    rgba(10, 19, 30, 0.86);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.035),
    0 0 16px rgba(34, 211, 238, 0.08);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: flex-start;
  }
`;

const ModeButton = styled.button`
  appearance: none;
  min-width: calc(4.8rem - (0.5rem * var(--toast-compact-progress, 0)));
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(126, 223, 255, 0.7)' : 'rgba(91, 215, 244, 0.34)'};
  border-radius: 8px;
  background: ${({ $active }) =>
    $active
      ? `linear-gradient(
          180deg,
          rgba(72, 224, 255, 0.42),
          rgba(74, 89, 212, 0.26) 48%,
          rgba(17, 29, 55, 0.96)
        )`
      : `linear-gradient(
          180deg,
          rgba(28, 49, 70, 0.86),
          rgba(10, 17, 28, 0.92)
        )`};
  color: ${({ $active }) => ($active ? '#f4fdff' : 'rgba(230, 244, 255, 0.92)')};
  padding: calc(0.38rem - (0.06rem * var(--toast-compact-progress, 0))) calc(0.82rem - (0.12rem * var(--toast-compact-progress, 0)));
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: calc(0.78rem - (0.04rem * var(--toast-compact-progress, 0)));
  font-weight: 760;
  letter-spacing: 0.045em;
  text-transform: uppercase;
  cursor: ${({ $active }) => ($active ? 'default' : 'pointer')};
  box-shadow: ${({ $active }) =>
    $active
      ? `0 0 0 1px rgba(0, 255, 200, 0.1),
        0 0 18px rgba(34, 211, 238, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.18)`
      : `inset 0 0 0 1px rgba(255, 255, 255, 0.035),
        0 0 0 1px rgba(0, 255, 200, 0.045)`};
  transition:
    border-color 120ms ease,
    background 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;

  &:hover:enabled {
    border-color: rgba(126, 223, 255, 0.72);
    background:
      linear-gradient(180deg, rgba(40, 70, 98, 0.92), rgba(14, 24, 40, 0.96)),
      rgba(20, 34, 46, 0.92);
    box-shadow:
      0 0 0 1px rgba(0, 255, 200, 0.08),
      0 0 18px rgba(34, 211, 238, 0.18);
    transform: translateY(-1px);
  }

  &:active:enabled {
    transform: translateY(0);
  }

  &:disabled {
    cursor: default;
    opacity: ${({ $active }) => ($active ? 1 : 0.44)};
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.72);
    outline-offset: 2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1;
    min-height: 38px;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export default function ItemPageConsoleActions({ itemName, onEdit }) {
  return (
    <Wrap>
      <Meta>
        <Kicker>Item actions</Kicker>
        <Name>{itemName || 'Unnamed Item'}</Name>
      </Meta>
      <Actions>
        <ModeButton type="button" $active aria-pressed="true" disabled>
          View
        </ModeButton>
        <ModeButton type="button" aria-pressed="false" onClick={onEdit}>
          Edit
        </ModeButton>
      </Actions>
    </Wrap>
  );
}
