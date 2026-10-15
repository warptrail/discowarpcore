import { controlStyles } from '../styles/primitives';
import React, { useRef } from 'react';
import styled from 'styled-components';
import useMobileCameraCapture from '../hooks/useMobileCameraCapture';

const PickerButton = styled.button`
  min-height: 44px;
  padding: 0.5rem 0.72rem;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: var(--dw-teal);
  cursor: pointer;

  &:hover:enabled { border-color: var(--dw-teal); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${controlStyles}
`;

export default function ImageSourcePicker({
  disabled = false,
  label = 'Choose Image',
  onFileSelected,
  renderAction,
  className,
  accept = 'image/*',
  capture,
  source = 'default',
}) {
  const inputRef = useRef(null);
  const cameraSource = source === 'camera' || Boolean(capture);
  const cameraAvailable = useMobileCameraCapture(cameraSource);
  const actionDisabled = disabled || (cameraSource && !cameraAvailable);

  const openPicker = () => {
    if (actionDisabled) return;
    inputRef.current?.click();
  };

  const handlePickedFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    onFileSelected?.(file, { source });
  };

  const action = {
    label,
    disabled: actionDisabled,
    title: cameraSource && !cameraAvailable ? 'Camera unavailable here. Choose a photo instead.' : undefined,
    onClick: openPicker,
  };

  return (
    <div className={className}>
      {typeof renderAction === 'function' ? (
        renderAction(action)
      ) : (
        <PickerButton
          type="button"
          onClick={action.onClick}
          disabled={actionDisabled}
          title={action.title}
        >
          {label}
        </PickerButton>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={cameraSource && cameraAvailable ? (capture || 'environment') : undefined}
        onChange={handlePickedFile}
        disabled={actionDisabled}
        style={{ display: 'none' }}
      />
    </div>
  );
}
