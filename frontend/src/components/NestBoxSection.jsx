// NestBoxSection.jsx (inline drop-down, no modal)
import React, { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { updateBoxById, releaseChildrenToFloor } from '../api/boxes';

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

const ContextCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
`;

const ContextTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-weight: 800;
  font-size: 15px;
  color: #eaeaea;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
  background: rgba(78, 199, 123, 0.16);
  border: 1px solid rgba(78, 199, 123, 0.35);
  color: rgba(220, 255, 235, 0.95);
`;

const Breadcrumb = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

const Crumb = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
`;

const Sep = styled.span`
  color: rgba(255, 255, 255, 0.35);
`;

const SubLabel = styled.div`
  margin-top: 10px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.82);
`;

const Hint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const SmallBtn = styled.button`
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const WarnBtn = styled(SmallBtn)`
  border-color: rgba(255, 212, 0, 0.35);
  background: rgba(255, 212, 0, 0.08);

  &:hover {
    border-color: rgba(255, 212, 0, 0.55);
    background: rgba(255, 212, 0, 0.12);
  }
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
  sourceBoxShortId, // optional: short id (#) for display
  boxTree, // the current box tree (for descendant detection)
  onClose, // () => void
  onConfirm, // (destBoxId, destLabel, destShortId) => void
  onDidNest, // optional: (result) => void
  onDidUnnest, // optional: (result) => void
  onDidReleaseChildren, // optional: (modifiedCount:number) => void
}) {
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes] = useState([]); // all candidate boxes (except current)
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localBoxTree, setLocalBoxTree] = useState(boxTree);

  // For future selection visuals if you want (not required to confirm)
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setLocalBoxTree(boxTree);
  }, [boxTree]);

  // Find descendants of the current box to prevent illegal choices
  const descendantIds = useMemo(
    () => collectDescendantBoxIds(localBoxTree),
    [localBoxTree],
  );

  const depthById = useMemo(() => buildDepthById(boxes), [boxes]);

  const currentParentId = useMemo(() => {
    const p = localBoxTree?.parentBox;
    if (!p) return null;
    // parentBox can be either an object ({ _id, ... }) or a string id
    return typeof p === 'string'
      ? String(p)
      : p?._id != null
        ? String(p._id)
        : null;
  }, [localBoxTree]);

  const parentChain = useMemo(() => {
    // Map of fetched boxes (note: list excludes the source box, but includes parents)
    const byId = new Map((boxes || []).map((b) => [String(b?._id), b]));
    const chain = [];

    let p = localBoxTree?.parentBox;
    const seen = new Set();

    while (p) {
      const pid =
        typeof p === 'string'
          ? String(p)
          : p?._id != null
            ? String(p._id)
            : null;
      if (!pid) break;
      if (seen.has(pid)) break; // defensive
      seen.add(pid);

      // Prefer the populated parent object, fallback to the fetched list entry
      const parentObj =
        typeof p === 'object' ? p : byId.get(pid) || { _id: pid };
      chain.push(parentObj);

      const next = byId.get(pid);
      p = next?.parentBox ?? null;
    }

    return chain.reverse();
  }, [boxes, localBoxTree]);

  const directChildren = Array.isArray(localBoxTree?.childBoxes)
    ? localBoxTree.childBoxes
    : [];
  const directChildShortIds = directChildren
    .map((c) => c?.box_id)
    .filter(Boolean);

  // Fetch all boxes except this one (uses your existing endpoint)
  useEffect(() => {
    if (!open) return;
    let alive = true;

    const fetchBoxesList = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:5002/api/boxes?exclude=${sourceBoxMongoId}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load boxes');
        if (!alive) return;
        setBoxes(Array.isArray(data) ? data : data?.boxes || []);
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load boxes');
      } finally {
        if (alive) setLoading(false);
      }
    };

    (async () => {
      await fetchBoxesList();
    })();

    return () => {
      alive = false;
    };
  }, [open, sourceBoxMongoId]);

  const refetchBoxes = async () => {
    try {
      const res = await fetch(
        `http://localhost:5002/api/boxes?exclude=${sourceBoxMongoId}`,
      );
      const data = await res.json();
      if (!res.ok) return;
      setBoxes(Array.isArray(data) ? data : data?.boxes || []);
    } catch {
      // silent for now; toast will handle later
    }
  };

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

      setLocalBoxTree((prev) =>
        prev
          ? {
              ...prev,
              parentBox: { _id: b._id, box_id: b.box_id, label: b.label },
            }
          : prev,
      );
      await refetchBoxes();

      // Back-compat: notify parent if it still expects the old callback
      onConfirm?.(b._id, b.label, b.box_id);

      // Preferred callback: parent can refresh tree state
      onDidNest?.(result);
      // Panel stays open: do not call onClose here
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
      setLocalBoxTree((prev) => (prev ? { ...prev, parentBox: null } : prev));
      await refetchBoxes();
      onDidUnnest?.(result);
      // Panel stays open: do not call onClose here
    } catch (e) {
      setError(e.message || 'Failed to unnest box');
    } finally {
      setBusy(false);
    }
  };

  const handleReleaseChildrenToFloor = async () => {
    if (!sourceBoxMongoId) return;
    setBusy(true);
    setError(null);

    try {
      const res = await releaseChildrenToFloor(sourceBoxMongoId);
      const modified = res?.modifiedCount ?? res?.data?.modifiedCount ?? 0;
      setLocalBoxTree((prev) => (prev ? { ...prev, childBoxes: [] } : prev));
      await refetchBoxes();
      onDidReleaseChildren?.(modified);
      // Panel stays open: do not call onClose here
    } catch (e) {
      // Inline errors are hidden; parent/toast will surface later.
      setError(e.message || 'Failed to release children');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NestPanel $open={open}>
      {open && (
        <SectionInner>
          <SectionHeader>
            <Title>
              Nest “{localBoxTree?.label ?? 'This box'}”
              {sourceBoxShortId || localBoxTree?.box_id
                ? ` (#${sourceBoxShortId || localBoxTree?.box_id})`
                : ''}{' '}
              in another box
            </Title>
            <GhostBtn onClick={onClose} disabled={busy}>
              Close
            </GhostBtn>
          </SectionHeader>

          <ContextCard>
            <ContextTitle>
              <Pill>Working on</Pill>
              <span>
                {localBoxTree?.label ?? 'This box'}
                {sourceBoxShortId || localBoxTree?.box_id
                  ? ` (#${sourceBoxShortId || localBoxTree?.box_id})`
                  : ''}
              </span>
            </ContextTitle>

            <SubLabel>Parent path</SubLabel>
            <Breadcrumb>
              <Crumb>
                <strong>Path:</strong> <span>Floor</span>
              </Crumb>
              {parentChain.map((p) => (
                <React.Fragment
                  key={String(p?._id || p?.box_id || Math.random())}
                >
                  <Sep>→</Sep>
                  <Crumb>
                    <span>{p?.box_id ? `#${p.box_id}` : ''}</span>
                    <span>{p?.label || p?.description || ''}</span>
                  </Crumb>
                </React.Fragment>
              ))}
            </Breadcrumb>

            {!currentParentId && (
              <Hint>This box is already on the floor (no parent).</Hint>
            )}

            <ActionRow>
              <WarnBtn
                disabled={busy || !currentParentId}
                onClick={handleUnnestToFloor}
                title={
                  currentParentId
                    ? 'Move this box to the floor (no parent)'
                    : 'Already on the floor'
                }
              >
                Unnest to floor
              </WarnBtn>

              <WarnBtn
                disabled={busy || directChildren.length === 0}
                onClick={handleReleaseChildrenToFloor}
                title={
                  directChildren.length > 0
                    ? 'Move this box’s direct child boxes to the floor (non-recursive)'
                    : 'No direct child boxes to release'
                }
              >
                Release direct children to floor
              </WarnBtn>
            </ActionRow>

            <SubLabel>Direct children</SubLabel>
            <Breadcrumb>
              <Crumb>
                <strong>Children:</strong> <span>{directChildren.length}</span>
              </Crumb>

              {directChildShortIds.length > 0 && (
                <>
                  <Sep>•</Sep>
                  <Crumb>
                    <span>
                      {directChildShortIds.map((id) => `#${id}`).join(', ')}
                    </span>
                  </Crumb>
                </>
              )}
            </Breadcrumb>

            {directChildren.length === 0 && (
              <Hint>No direct child boxes inside this box.</Hint>
            )}
          </ContextCard>

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
