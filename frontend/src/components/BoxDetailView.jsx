import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBoxTreeByShortId } from '../api/boxes';
import flattenBoxes from '../util/flattenBoxes';
import * as S from '../styles/BoxDetailView.styles';

import BoxMetaPanel from './BoxMetaPanel';
import TabControlBar from './TabControlBar';
import BoxTree from './BoxTree';
import ItemsFlatList from './ItemsFlatList';
import BoxActionPanel from '././BoxActionPanel';

const FLASH_MS = 1000; // keep in sync with CSS animation duration

export default function BoxDetailView({ parentPath, onNavigateBox }) {
  const { shortId } = useParams();

  // --- normalized state ---
  const [tree, setTree] = useState(null);
  const [flatItems, setFlatItems] = useState([]); // ✅ add this
  const [boxesById, setBoxesById] = useState(new Map());
  const [itemsById, setItemsById] = useState(new Map());
  const [childrenByBoxId, setChildrenByBoxId] = useState(new Map());
  const [rootId, setRootId] = useState(null);

  // --- status state ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- UI state ---
  const [activeTab, setActiveTab] = useState('tree');
  const [openItemId, setOpenItemId] = useState(null);
  const [pulsing, setPulsing] = useState([]);
  const [effectsById, setEffectsById] = useState({});
  const [accent, setAccent] = useState('blue');
  const [collapseDurMs] = useState(300);

  const flashTimeoutRef = useRef({}); // store timeouts per item
  const flashTimersRef = useRef({});

  const startPulse = useCallback((itemId) => {
    setPulsing((prev) => [...new Set([...prev, itemId])]);
  }, []);

  const stopPulse = useCallback((itemId) => {
    setPulsing((prev) => prev.filter((id) => id !== itemId));
  }, []);

  const triggerFlash = useCallback((itemId, color = 'blue', ms = FLASH_MS) => {
    // clear existing timer if present
    if (flashTimersRef.current[itemId]) {
      clearTimeout(flashTimersRef.current[itemId]);
      delete flashTimersRef.current[itemId];
    }

    // 1. set to null to drop the flash (ensures reset)
    setEffectsById((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], flash: null },
    }));

    // 2. re-enable flash on the next paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEffectsById((prev) => ({
          ...prev,
          [itemId]: { ...prev[itemId], flash: color },
        }));

        // 3. schedule cleanup
        const t = setTimeout(() => {
          setEffectsById((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], flash: null },
          }));
          delete flashTimersRef.current[itemId];
        }, ms);

        flashTimersRef.current[itemId] = t;
      });
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(flashTimeoutRef.current).forEach(clearTimeout);
      flashTimeoutRef.current = {};
    };
  }, []);

  // --- handlers ---
  const handleTabChange = useCallback((mode) => setActiveTab(mode), []);

  const handleOpen = useCallback(
    (itemId) => {
      if (openItemId === itemId) {
        triggerFlash(itemId);
        stopPulse(itemId);
        setOpenItemId(null);
      } else {
        if (openItemId) {
          triggerFlash(openItemId);
          stopPulse(openItemId);
        }
        triggerFlash(itemId);
        startPulse(itemId);
        setOpenItemId(itemId);
      }
    },
    [openItemId, triggerFlash, startPulse, stopPulse],
  );

  const handleNavigateBox = useCallback(
    (boxId) => onNavigateBox?.(boxId),
    [onNavigateBox],
  );
  const handleFlash = useCallback((id, effect) => {
    setEffectsById((prev) => ({ ...prev, [id]: effect }));
  }, []);

  // In BoxDetailView.jsx
  const handleItemSaved = (updated) => {
    if (!updated?._id) return;

    // --- Update the flat itemsById map ---
    setItemsById((prev) => {
      const next = new Map(prev);
      next.set(updated._id, updated);
      return next;
    });

    // --- Update the nested tree recursively ---
    setTree((prev) => {
      if (!prev) return prev;

      const replaceItemInNode = (node) => {
        if (!node) return node;

        // Replace in this node's items
        const items = (node.items || []).map((it) =>
          String(it._id) === String(updated._id) ? updated : it,
        );

        // Recurse into children
        const childBoxes = (node.childBoxes || []).map(replaceItemInNode);

        return { ...node, items, childBoxes };
      };

      return replaceItemInNode(prev);
    });
  };

  useEffect(() => {
    if (!shortId) return;
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const raw = await fetchBoxTreeByShortId(shortId);
        const treeNode = raw.tree ?? raw;

        if (!ignore && treeNode) {
          setTree(treeNode);

          // 👇 Flatten items with defensive logging
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
        if (!ignore) setError(e.message || String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [shortId]);

  // --- render ---
  return (
    <S.Wrap>
      <S.Content>
        {/* Meta / Header */}
        {tree && (
          <>
            <BoxMetaPanel
              box={tree}
              parentPath={parentPath}
              onNavigateBox={handleNavigateBox}
            />
            <TabControlBar
              mode={activeTab}
              onChange={handleTabChange}
              busy={!!loading}
            />
          </>
        )}

        {/* Status */}
        {loading && <S.Spinner />}
        {error && <S.ErrorBanner>{String(error)}</S.ErrorBanner>}

        {/* Content */}
        {!loading && !error && tree && activeTab === 'tree' && (
          <BoxTree
            node={tree}
            openItemId={openItemId}
            onOpenItem={handleOpen}
            accent={accent}
            pulsing={pulsing} // array of pulsing IDs
            collapseDurMs={collapseDurMs}
            effectsById={effectsById}
            triggerFlash={triggerFlash}
            startPulse={startPulse}
            stopPulse={stopPulse}
            onItemSaved={handleItemSaved} // root handler
          />
        )}

        {!loading && !error && tree && activeTab === 'flat' && (
          <>
            <div style={{ color: 'yellow' }}>
              Flat view: {flatItems.length} items loaded
            </div>
            <ItemsFlatList
              items={flatItems}
              openItemId={openItemId}
              onOpenItem={handleOpen}
              accent={accent}
              pulsing={pulsing}
              collapseDurMs={collapseDurMs}
              effectsById={effectsById}
              onFlash={handleFlash}
            />
          </>
        )}

        {!loading && !error && activeTab === 'edit' && tree && (
          <BoxActionPanel
            box={tree}
            boxTree={tree}
            boxMongoId={tree._id}
            flatItems={flatItems}
          />
        )}
      </S.Content>
    </S.Wrap>
  );
}
