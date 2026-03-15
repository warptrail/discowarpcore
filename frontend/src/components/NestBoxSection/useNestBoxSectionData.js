import { useEffect, useMemo, useState } from 'react';
import { updateBoxById, releaseChildrenToFloor } from '../../api/boxes';
import {
  buildDepthById,
  collectDescendantBoxIds,
  getCurrentParentId,
  getParentChain,
  getVisibleBoxes,
} from './nestBoxUtils';

export default function useNestBoxSectionData({
  open,
  sourceBoxMongoId,
  boxTree,
  onConfirm,
  onDidNest,
  onDidUnnest,
  onDidReleaseChildren,
}) {
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localBoxTree, setLocalBoxTree] = useState(boxTree);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setLocalBoxTree(boxTree);
  }, [boxTree]);

  const descendantIds = useMemo(
    () => collectDescendantBoxIds(localBoxTree),
    [localBoxTree],
  );

  const depthById = useMemo(() => buildDepthById(boxes), [boxes]);
  const currentParentId = useMemo(
    () => getCurrentParentId(localBoxTree),
    [localBoxTree],
  );

  const parentChain = useMemo(
    () => getParentChain({ boxes, localBoxTree }),
    [boxes, localBoxTree],
  );

  const directChildren = Array.isArray(localBoxTree?.childBoxes)
    ? localBoxTree.childBoxes
    : [];

  const directChildShortIds = directChildren.map((c) => c?.box_id).filter(Boolean);

  const visibleBoxes = useMemo(
    () =>
      getVisibleBoxes({
        boxes,
        descendantIds,
        sourceBoxMongoId,
        currentParentId,
        depthById,
      }),
    [boxes, descendantIds, sourceBoxMongoId, currentParentId, depthById],
  );

  const fetchBoxesList = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(`/api/boxes?exclude=${sourceBoxMongoId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load boxes');
      setBoxes(Array.isArray(data) ? data : data?.boxes || []);
    } catch (e) {
      if (!silent) setError(e.message || 'Failed to load boxes');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    let alive = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/boxes?exclude=${sourceBoxMongoId}`);
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

    run();

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
      const previousParentRaw = localBoxTree?.parentBox;
      const previousParentId =
        previousParentRaw == null
          ? null
          : typeof previousParentRaw === 'string'
            ? String(previousParentRaw)
            : previousParentRaw?._id != null
              ? String(previousParentRaw._id)
              : null;

      const previousParentFromChain = parentChain[parentChain.length - 1] || null;
      const previousParentLabel =
        (typeof previousParentRaw === 'object' ? previousParentRaw?.label : null) ||
        previousParentFromChain?.label ||
        null;
      const previousParentShortId =
        (typeof previousParentRaw === 'object' ? previousParentRaw?.box_id : null) ||
        previousParentFromChain?.box_id ||
        null;

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
      await fetchBoxesList({ silent: true });

      onConfirm?.(b._id, b.label, b.box_id);
      onDidNest?.({
        result,
        sourceBoxId: sourceBoxMongoId,
        previousParentId,
        previousParentLabel,
        previousParentShortId,
        nextParentId: String(b._id),
        nextParentLabel: b.label ?? null,
        nextParentShortId: b.box_id ?? null,
      });
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
      await fetchBoxesList({ silent: true });
      onDidUnnest?.(result);
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
      await fetchBoxesList({ silent: true });
      onDidReleaseChildren?.(modified);
    } catch (e) {
      setError(e.message || 'Failed to release children');
    } finally {
      setBusy(false);
    }
  };

  return {
    loading,
    error,
    busy,
    selectedId,
    localBoxTree,
    parentChain,
    currentParentId,
    directChildren,
    directChildShortIds,
    depthById,
    visibleBoxes,
    chooseDest,
    handleUnnestToFloor,
    handleReleaseChildrenToFloor,
  };
}
