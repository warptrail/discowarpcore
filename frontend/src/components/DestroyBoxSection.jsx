// src/components/DestroyBoxSection.jsx
import { useState, useEffect } from 'react';

export default function DestroyBoxSection({
  open,
  busy,
  shortId,
  boxMongoId,
  onRequestDelete, // <-- parent’s delete executor
  onCancel, // optional
}) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    setConfirmText('');
  }, [shortId]);

  const canSubmit = confirmText.trim() === shortId && !busy;

  if (!open) return null; // nothing rendered

  return (
    <div style={{ border: '1px solid #333', borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Destroy Box</h3>
      <p>
        This will permanently delete box <strong>#{shortId}</strong>
        {boxMongoId ? (
          <>
            {' '}
            (<code>{boxMongoId}</code>)
          </>
        ) : null}
        . This cannot be undone.
      </p>

      <label style={{ display: 'block', margin: '12px 0 6px' }}>
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

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={onRequestDelete} // <-- trigger parent delete
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

        {onCancel && (
          <button onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
