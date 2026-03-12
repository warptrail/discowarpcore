import { useEffect, useState } from 'react';
import { fetchBoxTreeByShortId } from '../../api/boxes';
import flattenBoxes from '../../util/flattenBoxes';

export default function useBoxDetailData(shortId) {
  const [tree, setTree] = useState(null);
  const [flatItems, setFlatItems] = useState([]);
  const [parentPath, setParentPath] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shortId) return;
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const raw = await fetchBoxTreeByShortId(shortId);
        const treeNode = raw.tree ?? raw;
        const ancestorPath = Array.isArray(raw?.ancestors) ? raw.ancestors : [];

        if (!ignore && treeNode) {
          setTree(treeNode);
          setParentPath(ancestorPath);
          setStats(raw?.stats ?? null);

          const flatArray = flattenBoxes(treeNode);
          console.log('Flat array result:', flatArray);
          console.table(flatArray, [
            '_id',
            'name',
            'quantity',
            'parentBoxLabel',
          ]);

          setFlatItems(flatArray);
        }
      } catch (e) {
        if (!ignore) {
          setError(e.message || String(e));
          setParentPath([]);
          setStats(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [shortId]);

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
  };
}
