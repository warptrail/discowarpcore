import React, { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

const Panel = styled.div`
  overflow: hidden;
  background: #171717;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  transition: max-height 220ms ease, margin-top 220ms ease;
  max-height: 0;
  margin-top: 0;

  ${({ $open }) =>
    $open &&
    css`
      max-height: 260px; /* adjust if your copy grows */
      margin-top: 12px;
    `}
`;

const Inner = styled.div`
  padding: 12px;
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #eaeaea;
`;

const Subtle = styled.div`
  font-size: 12px;
  color: #bdbdbd;
  margin-top: 6px;
`;

const DangerBox = styled.div`
  margin-top: 10px;
  background: #2a1616;
  border: 1px solid #3a1d1d;
  color: #ffbdbd;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;

  strong {
    color: #ffd1d1;
  }
`;

const Field = styled.input`
  width: 100%;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #3a3a3a;
  background: #111;
  color: #eaeaea;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #ff4d4f;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
  }
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
`;

const Ghost = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #2f2f2f;
  background: #141414;
  color: #eaeaea;
  cursor: pointer;
  &:hover {
    border-color: #4ec77b;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Danger = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #3a2323;
  background: #2a1616;
  color: #ffbdbd;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: #ff4d4f;
    color: #fff;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/**
 * DestroyBoxSection (inline, collapsible)
 *
 * Props:
 * - open: boolean                     // show/collapse
 * - boxMongoId: string                // current box id
 * - boxLabel: string                  // for confirmation UX, e.g. "Kitchen"
 * - boxShortId?: string | number      // optional, e.g. "A12"
 * - onCancel: () => void              // parent collapses panel (setActivePanel(null))
 * - onDeleted: () => void             // called after successful DELETE (parent shows toast / navigates)
 */
export default function DestroyBoxSection({
  open,
  boxMongoId,
  boxLabel,
  boxShortId,
  onCancel,
  onDeleted,
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // We’ll accept either the exact label (case-sensitive) OR the literal word DELETE
  const acceptTokens = useMemo(() => {
    const tokens = ['DELETE'];
    if (boxLabel) tokens.push(boxLabel);
    return tokens;
  }, [boxLabel]);

  const ok = acceptTokens.some((t) => t === text.trim());

  const doDelete = async () => {
    if (!ok || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5002/api/boxes/${boxMongoId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Failed to destroy box');
      }
      onDeleted?.(); // parent will: show sticky toast + navigate/refresh
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel $open={open} aria-hidden={!open}>
      {open && (
        <Inner>
          <Title>Destroy this box?</Title>
          <Subtle>
            This action <strong>cannot</strong> be undone. Items inside will
            remain orphaned.
            {boxShortId
              ? `  Box: ${boxLabel} (#${boxShortId})`
              : `  Box: ${boxLabel}`}
          </Subtle>

          <DangerBox>
            To confirm, type <strong>{boxLabel}</strong> exactly, or type{' '}
            <strong>DELETE</strong>.
          </DangerBox>

          <Field
            autoFocus
            placeholder={`Type "${boxLabel}" or "DELETE" to confirm`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ok && !busy) doDelete();
              if (e.key === 'Escape' && !busy) onCancel?.();
            }}
          />

          {error && (
            <Subtle style={{ color: '#ffbdbd', marginTop: 6 }}>{error}</Subtle>
          )}

          <Row>
            <Ghost onClick={onCancel} disabled={busy}>
              Cancel
            </Ghost>
            <Danger onClick={doDelete} disabled={!ok || busy}>
              {busy ? 'Destroying…' : 'Destroy box'}
            </Danger>
          </Row>
        </Inner>
      )}
    </Panel>
  );
}
