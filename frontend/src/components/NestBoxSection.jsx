// NestBoxSection.jsx (inline drop-down, no modal)
import React, { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

/* --- Styled wrappers --- */

const NestPanel = styled.div`
  overflow: hidden;
  background: #171717;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  transition: max-height 220ms ease, margin-top 220ms ease,
    border-color 220ms ease;
  max-height: 0;
  margin-top: 0;

  ${({ $open, $maxHeight = 600 }) =>
    $open &&
    css`
      max-height: ${$maxHeight}px;
      margin-top: 12px;
    `}
`;

const SectionInner = styled.div`
  padding: 12px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 15px;
  color: #eaeaea;
`;

const Note = styled.div`
  font-size: 12px;
  color: #bdbdbd;
`;

const DangerNote = styled.div`
  margin: 8px 0 10px;
  background: #2a1616;
  border: 1px solid #3a1d1d;
  color: #ffbdbd;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
`;

const Grid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr; /* mobile-first */
  @media (min-width: 520px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 760px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const BoxBtn = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid
    ${({ $disabled, $selected }) =>
      $selected ? '#4ec77b' : $disabled ? '#2a2a2a' : '#2a2a2a'};
  background: ${({ $disabled }) => ($disabled ? '#141414' : '#1a1a1a')};
  color: #eaeaea;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};
  transition: border-color 0.15s ease, background 0.15s ease,
    transform 0.08s ease;

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? '#2a2a2a' : '#4ec77b')};
  }
  &:active {
    transform: translateY(1px);
  }
`;

const Meta = styled.div`
  font-size: 12px;
  color: #bdbdbd;
`;

const Footer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
`;

const GhostBtn = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #2f2f2f;
  background: #141414;
  color: #eaeaea;
  cursor: pointer;
  &:hover {
    border-color: #4ec77b;
  }
`;

/* --- Utilities --- */

/** Collect descendant box ids from your current box tree to prevent cycles.
 * Adjust traversal keys if your tree uses a different shape.
 */
function collectDescendantBoxIds(root) {
  const ids = new Set();
  if (!root) return ids;

  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    // Push nested containers; adjust keys to match your box tree
    const kids = node?.children || node?.boxes || node?.items || [];

    for (const child of kids) {
      // Consider it a box if it has children/items/boxes (tweak as needed)
      const isBox =
        !!child?.children?.length ||
        !!child?.boxes?.length ||
        !!child?.items?.length ||
        child?.kind === 'box' ||
        child?.type === 'box';

      if (isBox && child?._id) {
        ids.add(String(child._id));
      }
      // Always traverse deeper
      if (child) stack.push(child);
    }
  }
  return ids;
}

/* --- Component --- */

export default function NestBoxSection({
  open, // boolean: show/collapse
  boxMongoId, // current box id (string)
  boxTree, // the current box tree (for descendant detection)
  onClose, // () => void
  onConfirm, // (destBoxId, destLabel, destShortId) => void
  maxHeight = 600, // optional: cap panel height when open
}) {
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes] = useState([]); // all candidate boxes (except current)
  const [error, setError] = useState(null);

  // For future selection visuals if you want (not required to confirm)
  const [selectedId, setSelectedId] = useState(null);

  // Find descendants of the current box to prevent illegal choices
  const descendantIds = useMemo(
    () => collectDescendantBoxIds(boxTree),
    [boxTree]
  );
  const hasNestedChildren = descendantIds.size > 0;

  // Fetch all boxes except this one (uses your existing endpoint)
  useEffect(() => {
    if (!open) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:5002/api/boxes?exclude=${boxMongoId}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load boxes');

        if (!alive) return;

        // Expecting an array of { _id, label, box_id, ... }
        setBoxes(Array.isArray(data) ? data : data?.boxes || []);
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load boxes');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, boxMongoId]);

  // Inline click handler for a destination choice
  const chooseDest = (b) => {
    if (!b?._id) return;
    const isSelf = String(b._id) === String(boxMongoId);
    const isDesc = descendantIds.has(String(b._id));
    if (isSelf || isDesc) return; // safety: should be disabled anyway

    // Optionally set selected for a quick visual cue
    setSelectedId(b._id);

    // Pass back the destination
    onConfirm?.(b._id, b.label, b.box_id);
  };

  return (
    <NestPanel $open={open} $maxHeight={maxHeight}>
      {open && (
        <SectionInner>
          <SectionHeader>
            <Title>Nest “{boxTree?.label ?? 'This box'}” in another box</Title>
            <GhostBtn onClick={onClose}>Close</GhostBtn>
          </SectionHeader>

          {hasNestedChildren && (
            <DangerNote>
              Heads up: this box contains nested boxes. You can still nest it,
              but you <em>cannot</em> select any of its own descendants as a
              destination.
            </DangerNote>
          )}

          {error && <DangerNote>{error}</DangerNote>}

          <Note style={{ marginBottom: 8 }}>Choose a destination box:</Note>

          {loading ? (
            <Note>Loading boxes…</Note>
          ) : (
            <Grid>
              {boxes.map((b) => {
                const isSelf = String(b._id) === String(boxMongoId);
                const isDesc = descendantIds.has(String(b._id));
                const disabled = isSelf || isDesc;
                return (
                  <BoxBtn
                    key={b._id}
                    $disabled={disabled}
                    $selected={selectedId === b._id}
                    onClick={() => chooseDest(b)}
                    disabled={disabled}
                    title={
                      disabled
                        ? isSelf
                          ? 'Cannot nest a box into itself'
                          : 'Cannot nest into a descendant (would create a cycle)'
                        : `Nest into ${b.label} (#${b.box_id})`
                    }
                  >
                    <div style={{ fontWeight: 700 }}>{b.label}</div>
                    <Meta>
                      #{b.box_id} &middot; {b._id}
                    </Meta>
                  </BoxBtn>
                );
              })}

              {boxes.length === 0 && !loading && !error && (
                <Note>No available boxes to nest into.</Note>
              )}
            </Grid>
          )}
          {/* You can add “Create new box” or extra actions here later */}
        </SectionInner>
      )}
    </NestPanel>
  );
}
