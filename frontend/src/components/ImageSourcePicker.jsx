import React, { useRef } from 'react';

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

  const openPicker = () => {
    if (disabled) return;
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
    disabled,
    onClick: openPicker,
  };

  return (
    <div className={className}>
      {typeof renderAction === 'function' ? (
        renderAction(action)
      ) : (
        <button
          type="button"
          onClick={action.onClick}
          disabled={disabled}
        >
          {label}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        onChange={handlePickedFile}
        disabled={disabled}
        style={{ display: 'none' }}
      />
    </div>
  );
}
