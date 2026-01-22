// NestBoxSection.jsx (inline drop-down, no modal)
import React, { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { updateBoxById } from '../api/boxes';

/* --- Styled wrappers --- */

const NestPanel = styled.div`
  background: #171717;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  margin-top: 0;
  display: none;

  ${({ $open }) =>
    $open &&
    css`
      display: block;
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

/* Removed DangerNote styled component as per instructions */

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
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
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

const DepthStrip = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  height: 6px;
  align-items: center;
`;

const DepthSeg = styled.div`
  flex: 1 1 0;
  height: 6px;
  border-radius: 999px;
  background: ${({ $level }) =>
    `rgba(78, 199, 123, ${Math.min(0.15 + $level * 0.12, 0.9)})`};
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

  // We only care about descendant *boxes*, so traverse `childBoxes` only.
  const stack = Array.isArray(root?.childBoxes) ? [...root.childBoxes] : [];

  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;

    if (node?._id) ids.add(String(node._id));

    const kids = Array.isArray(node?.childBoxes) ? node.childBoxes : [];
    for (const child of kids) {
      if (child) stack.push(child);
    }
  }

  return ids;
}

function buildDepthById(boxes) {
  const parentById = new Map();
  for (const b of boxes || []) {
    const id = b?._id != null ? String(b._id) : null;
    if (!id) continue;
    const parentId =
      b?.parentBox && b.parentBox._id != null ? String(b.parentBox._id) : null;
    parentById.set(id, parentId);
  }

  const memo = new Map();

  const depthOf = (id) => {
    const key = String(id);
    if (memo.has(key)) return memo.get(key);

    let depth = 0;
    let cur = key;
    const seen = new Set();

    while (true) {
      const p = parentById.get(cur);
      if (!p) break;

      // Defensive: if data ever contains a cycle, avoid infinite loops.
      if (seen.has(cur)) {
        depth = 0;
        break;
      }
      seen.add(cur);

      depth += 1;
      cur = p;
    }

    memo.set(key, depth);
    return depth;
  };

  const out = new Map();
  for (const id of parentById.keys()) out.set(id, depthOf(id));
  return out;
}

/* --- Component --- */

export default function NestBoxSection({
  open, // boolean: show/collapse
  sourceBoxMongoId, // Mongo _id of the box being moved (string)
  boxTree, // the current box tree (for descendant detection)
  onClose, // () => void
  onConfirm, // (destBoxId, destLabel, destShortId) => void
  onDidNest, // optional: (result) => void
  onDidUnnest, // optional: (result) => void
}) {
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes] = useState([]); // all candidate boxes (except current)
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // For future selection visuals if you want (not required to confirm)
  const [selectedId, setSelectedId] = useState(null);

  // Find descendants of the current box to prevent illegal choices
  const descendantIds = useMemo(
    () => collectDescendantBoxIds(boxTree),
    [boxTree],
  );

  const depthById = useMemo(() => buildDepthById(boxes), [boxes]);

  const currentParentId = useMemo(() => {
    const p = boxTree?.parentBox;
    if (!p) return null;
    // parentBox can be either an object ({ _id, ... }) or a string id
    return typeof p === 'string'
      ? String(p)
      : p?._id != null
        ? String(p._id)
        : null;
  }, [boxTree]);

  // Fetch all boxes except this one (uses your existing endpoint)
  useEffect(() => {
    if (!open) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:5002/api/boxes?exclude=${sourceBoxMongoId}`,
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
  }, [open, sourceBoxMongoId]);

  const chooseDest = async (b) => {
    if (!b?._id) return;
    const isSelf =
      sourceBoxMongoId != null && String(b._id) === String(sourceBoxMongoId);
    const isDesc = descendantIds.has(String(b._id));
    const isCurrentParent =
      currentParentId != null && String(b._id) === String(currentParentId);
    if (isSelf || isDesc || isCurrentParent) return;

    setSelectedId(b._id);
    setBusy(true);
    setError(null);

    try {
      // Nest the current box into the destination box
      const result = await updateBoxById(sourceBoxMongoId, {
        parentBox: b._id,
      });

      // Back-compat: notify parent if it still expects the old callback
      onConfirm?.(b._id, b.label, b.box_id);

      // Preferred callback: parent can refresh tree state
      onDidNest?.(result);

      // Close after success
      onClose?.();
    } catch (e) {
      setError(e.message || 'Failed to nest box');
    } finally {
      setBusy(false);
    }
  };

  const handleUnnestToFloor = async () => {
    if (!sourceBoxMongoId) return;
    setBusy(true);
    setError(null);

    try {
      const result = await updateBoxById(sourceBoxMongoId, { parentBox: null });
      onDidUnnest?.(result);
      onClose?.();
    } catch (e) {
      setError(e.message || 'Failed to unnest box');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NestPanel $open={open}>
      {open && (
        <SectionInner>
          <SectionHeader>
            <Title>Nest “{boxTree?.label ?? 'This box'}” in another box</Title>
            <GhostBtn onClick={onClose} disabled={busy}>
              Close
            </GhostBtn>
          </SectionHeader>

          {/* Removed error display as per instructions */}

          <Note style={{ marginBottom: 8 }}>Choose a destination box:</Note>

          {loading ? (
            <Note>Loading boxes…</Note>
          ) : (
            <>
              {(() => {
                const visibleBoxes = boxes
                  .filter(
                    (b) =>
                      !descendantIds.has(String(b?._id)) &&
                      String(b?._id) !== String(sourceBoxMongoId) &&
                      (currentParentId == null ||
                        String(b?._id) !== String(currentParentId)),
                  )
                  .sort((a, b) => {
                    const da = depthById.get(String(a?._id)) ?? 0;
                    const db = depthById.get(String(b?._id)) ?? 0;
                    if (da !== db) return da - db;

                    const na = Number(a?.box_id);
                    const nb = Number(b?.box_id);
                    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;

                    return String(a?.box_id ?? '').localeCompare(
                      String(b?.box_id ?? ''),
                    );
                  });
                return (
                  <Grid>
                    {currentParentId && (
                      <BoxBtn
                        key="__floor__"
                        $selected={selectedId === '__floor__'}
                        $disabled={busy}
                        disabled={busy}
                        onClick={() => {
                          setSelectedId('__floor__');
                          handleUnnestToFloor();
                        }}
                        title="Unnest to floor (no parent)"
                      >
                        <div style={{ fontWeight: 700 }}>Floor (no parent)</div>
                        <Meta>Unnest this box to the top level</Meta>
                        <DepthStrip title="Floor level (no parent)">
                          <DepthSeg
                            style={{ background: 'rgba(220, 180, 60, 0.85)' }}
                            title="Floor level"
                          />
                        </DepthStrip>
                      </BoxBtn>
                    )}
                    {visibleBoxes.map((b) => (
                      <BoxBtn
                        key={b._id}
                        $selected={selectedId === b._id}
                        $disabled={busy}
                        disabled={busy}
                        onClick={() => chooseDest(b)}
                        title={`Nest into ${b.label} (#${b.box_id})`}
                      >
                        <div style={{ fontWeight: 700 }}>{b.label}</div>
                        <Meta>
                          #{b.box_id} &middot; {b._id}
                        </Meta>
                        {(() => {
                          const depth = depthById.get(String(b._id)) ?? 0;
                          const capped = Math.min(depth, 6);
                          if (depth <= 0) return null;

                          return (
                            <DepthStrip title={`Nesting depth: ${depth}`}>
                              {Array.from({ length: capped }).map((_, i) => (
                                <DepthSeg key={i} $level={i + 1} />
                              ))}
                              {depth > 6 && (
                                <DepthSeg
                                  $level={7}
                                  title={`Nesting depth: ${depth}`}
                                />
                              )}
                            </DepthStrip>
                          );
                        })()}
                      </BoxBtn>
                    ))}

                    {visibleBoxes.length === 0 && !loading && !error && (
                      <Note>No available boxes to nest into.</Note>
                    )}
                  </Grid>
                );
              })()}
            </>
          )}
          {/* You can add “Create new box” or extra actions here later */}
        </SectionInner>
      )}
    </NestPanel>
  );
}
