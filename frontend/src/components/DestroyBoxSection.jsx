// src/components/DestroyBoxSection.jsx
import { useEffect, useContext, useRef, useState } from 'react';
import { ToastContext } from './Toast';

export default function DestroyBoxSection({
  open,
  busy,
  shortId,
  boxMongoId,
  onRequestDelete, // <-- parent’s delete executor
  onCancel, // optional
}) {
  const { showToast, hideToast } = useContext(ToastContext);
  const toastShownForRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Prevent re-firing the toast repeatedly while the section stays open
    const key = `${boxMongoId || ''}:${shortId || ''}`;
    if (toastShownForRef.current === key) return;
    toastShownForRef.current = key;

    const ToastBody = function DestroyBoxToastBody() {
      const [confirmText, setConfirmText] = useState('');
      const canSubmit = confirmText.trim() === String(shortId) && !busy;

      return (
        <div style={{ display: 'grid', gap: 10 }}>
          <p style={{ margin: 0 }}>
            This will permanently delete box <strong>#{shortId}</strong>. This
            cannot be undone.
          </p>

          <label style={{ display: 'block' }}>
            Type <code>{shortId}</code> to confirm:
          </label>

          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={busy}
            placeholder={`Type ${shortId}`}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 8,
              border: '1px solid #444',
              background: '#0e0e0e',
              color: '#eee',
            }}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                hideToast?.();
                onCancel?.();
              }}
              disabled={busy}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
              }}
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                if (!canSubmit) return;
                await onRequestDelete?.();
              }}
              disabled={!canSubmit}
              aria-busy={busy ? 'true' : 'false'}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #5a1212',
                background: '#2b0000',
                color: '#ffd04d',
                opacity: canSubmit ? 1 : 0.6,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
              title={!canSubmit ? 'Type the short id to enable' : 'Destroy box'}
            >
              {busy ? 'Destroying…' : 'Destroy Box'}
            </button>
          </div>
        </div>
      );
    };

    showToast?.({
      variant: 'danger',
      title: `Destroy Box #${shortId}`,
      message: 'Type the code below to confirm.',
      content: <ToastBody />,
      sticky: true,
      onClose: () => {
        onCancel?.();
      },
    });
  }, [
    open,
    boxMongoId,
    shortId,
    busy,
    showToast,
    hideToast,
    onRequestDelete,
    onCancel,
  ]);

  if (!open) return null; // nothing rendered

  return (
    <div style={{ border: '1px solid #333', borderRadius: 12, padding: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }} role="img" aria-label="danger">
            🔥🔥
          </span>
          <div>
            <div style={{ fontWeight: 700 }}>Danger zone</div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              Destruction confirmation is active in the header toast.
            </div>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={() => {
              hideToast?.();
              onCancel();
            }}
            disabled={busy}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
