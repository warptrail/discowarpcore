import { controlStyles } from '../styles/primitives';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
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
  gap: 0.32rem;
  flex: 0 0 auto;
  padding: 0.1rem;

  ${({ $prism }) => $prism && `padding: 0;`}
`;

const ModeButton = styled.button`
  ${controlStyles}
  appearance: none;
  min-width: calc(4.8rem - (0.5rem * var(--toast-compact-progress, 0)));
  min-height: 44px;
  padding: calc(0.38rem - (0.06rem * var(--toast-compact-progress, 0)))
    calc(0.82rem - (0.12rem * var(--toast-compact-progress, 0)));
  border: 1px solid ${({ $active, $primary }) =>
    $active || $primary ? 'rgba(127, 215, 255, 0.52)' : 'rgba(230, 237, 243, 0.16)'};
  border-radius: var(--dw-radius);
  background: ${({ $active }) => $active ? 'var(--dw-surface-raised)' : 'var(--dw-surface)'};
  color: ${({ $active, $primary }) => $active || $primary ? 'var(--dw-cyan)' : 'var(--dw-text-secondary)'};
  font-family: var(--dw-font-ui);
  font-size: calc(0.78rem - (0.04rem * var(--toast-compact-progress, 0)));
  font-weight: 760;
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: ${({ $active }) => $active ? 'default' : 'pointer'};
  transition: border-color 120ms ease, background 120ms ease;

  &:hover:enabled {
    border-color: var(--dw-cyan);
    background: var(--dw-surface-raised);
  }

  &:disabled {
    cursor: default;
    opacity: ${({ $active }) => $active ? 1 : 0.44};
  }

  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1;
    min-height: 44px;
    font-size: ${MOBILE_FONT_XS};
  }

  ${({ $prism, $primary }) => $prism && `
    min-width: 6.8rem;
    min-height: 44px;
    padding: 0.38rem 0.72rem;
    border-color: ${$primary ? 'rgba(76, 198, 193, 0.42)' : 'rgba(230, 237, 243, 0.16)'};
    color: ${$primary ? 'var(--dw-teal)' : 'var(--dw-text-secondary)'};
    font-size: 0.75rem;
    letter-spacing: 0.01em;
  `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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
