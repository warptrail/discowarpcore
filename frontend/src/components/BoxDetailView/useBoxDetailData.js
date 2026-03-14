import { useCallback, useEffect, useState } from 'react';
import { fetchBoxTreeByShortId } from '../../api/boxes';
import flattenBoxes from '../../util/flattenBoxes';

export default function useBoxDetailData(shortId) {
  const [tree, setTree] = useState(null);
  const [flatItems, setFlatItems] = useState([]);
  const [parentPath, setParentPath] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadBoxData = useCallback(
    async ({ signal, silent = false } = {}) => {
      if (!shortId) return null;

      if (!silent) setLoading(true);
      setError(null);

      try {
        const raw = await fetchBoxTreeByShortId(shortId, { signal });
        const treeNode = raw.tree ?? raw;
        const ancestorPath = Array.isArray(raw?.ancestors) ? raw.ancestors : [];

        if (treeNode) {
          setTree(treeNode);
          setParentPath(ancestorPath);
          setStats(raw?.stats ?? null);
          setFlatItems(flattenBoxes(treeNode));
        }

        return treeNode;
      } catch (e) {
        if (e?.name === 'AbortError') return null;
        setError(e.message || String(e));
        setParentPath([]);
        setStats(null);
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [shortId],
  );

  useEffect(() => {
    if (!shortId) return;
    const controller = new AbortController();
    loadBoxData({ signal: controller.signal });
    return () => controller.abort();
  }, [shortId, loadBoxData]);

  const refreshBox = useCallback(
    async () => loadBoxData({ silent: true }),
    [loadBoxData],
  );

  const handleItemSaved = (updated) => {
    if (!updated?._id) return;

    setTree((prev) => {
      if (!prev) return prev;

      const replaceItemInNode = (node) => {
        if (!node) return node;

        const items = (node.items || []).map((it) =>
          String(it._id) === String(updated._id) ? updated : it,
        );

        const childBoxes = (node.childBoxes || []).map(replaceItemInNode);

        return { ...node, items, childBoxes };
      };

      return replaceItemInNode(prev);
    });
  };

  return {
    tree,
    flatItems,
    parentPath,
    stats,
    loading,
    error,
    handleItemSaved,
    refreshBox,
  };
}
