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
  width: 100%;
  gap: calc(0.7rem - (0.18rem * var(--toast-compact-progress, 0)));
  min-width: 0;

  ${({ $prism }) =>
    $prism &&
    `
      justify-content: flex-end;
      gap: 0;
    `}
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.24rem;
  flex: 0 0 auto;
  padding: 0.1rem;
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.24);
  border-radius: 4px;
  background: rgba(5, 12, 19, 0.44);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);

  ${({ $prism }) =>
    $prism &&
    `
      gap: 0.32rem;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    `}
`;

const ModeButton = styled.button`
  appearance: none;
  min-width: calc(4.8rem - (0.5rem * var(--toast-compact-progress, 0)));
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(126, 223, 255, 0.7)' : 'rgba(91, 215, 244, 0.34)'};
  border-radius: 3px;
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
    min-height: ${({ $prism }) => ($prism ? '44px' : '38px')};
    font-size: ${MOBILE_FONT_XS};
  }

  ${({ $prism, $primary }) =>
    $prism &&
    `
      min-width: 6.8rem;
      min-height: 44px;
      padding: 0.38rem 0.72rem;
      border-color: ${$primary ? 'rgba(100, 225, 218, 0.5)' : 'rgba(177, 159, 239, 0.34)'};
      border-radius: 6px;
      background: ${$primary ? 'rgba(45, 154, 151, 0.13)' : 'rgba(103, 86, 158, 0.08)'};
      color: ${$primary ? 'rgba(224, 255, 251, 0.96)' : 'rgba(225, 220, 246, 0.88)'};
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      transform: none;

      &:hover:enabled {
        border-color: ${$primary ? 'rgba(115, 241, 233, 0.76)' : 'rgba(196, 177, 255, 0.64)'};
        background: ${$primary ? 'rgba(45, 154, 151, 0.2)' : 'rgba(103, 86, 158, 0.14)'};
        box-shadow: 0 0 14px ${$primary ? 'rgba(73, 211, 202, 0.14)' : 'rgba(169, 139, 250, 0.1)'};
        transform: none;
      }

      &:focus-visible {
        outline-color: ${$primary ? 'rgba(115, 241, 233, 0.9)' : 'rgba(196, 177, 255, 0.82)'};
      }

      &:disabled {
        border-color: rgba(150, 166, 181, 0.18);
        background: rgba(17, 23, 30, 0.76);
        color: rgba(205, 216, 225, 0.42);
        box-shadow: none;
      }
    `}
`;

export default function ItemPageConsoleActions({
  isEditing = false,
  onView,
  onEdit,
  onSave,
  onRevert,
  saving = false,
  isDirty = false,
  lifecycleBusy = false,
  revertLabel = 'Revert',
  revertRequiresDirty = true,
  saveLabel = 'Save',
  showViewAction = true,
  prism = false,
}) {
  return (
    <Wrap $prism={prism}>
      {!prism ? <span aria-hidden="true" /> : null}
      <Actions $prism={prism}>
        {showViewAction ? (
          <ModeButton
            type="button"
            $active={!isEditing}
            aria-pressed={!isEditing}
            onClick={onView}
            disabled={!isEditing}
          >
            View
          </ModeButton>
        ) : null}
        {isEditing ? (
          <>
            <ModeButton
              type="button"
              $prism={prism}
              $primary
              onClick={onSave}
              disabled={!isDirty || saving || lifecycleBusy}
            >
              {saving ? 'Saving...' : saveLabel}
            </ModeButton>
            <ModeButton
              type="button"
              $prism={prism}
              onClick={onRevert}
              disabled={(revertRequiresDirty && !isDirty) || saving || lifecycleBusy}
            >
              {revertLabel}
            </ModeButton>
          </>
        ) : (
          <ModeButton
            type="button"
            $active={false}
            aria-pressed={false}
            onClick={onEdit}
          >
            Edit
          </ModeButton>
        )}
      </Actions>
    </Wrap>
  );
}
