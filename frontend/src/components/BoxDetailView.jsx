import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBoxTreeByShortId } from '../api/boxes';
import flattenBoxes from '../util/flattenBoxes';
import * as S from '../styles/BoxDetailView.styles';

import BoxMetaPanel from './BoxMetaPanel';
import TabControlBar from './TabControlBar';
import BoxTree from './BoxTree';
import ItemsFlatList from './ItemsFlatList';
import BoxEditPanel from './BoxEditPanel';

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

  const startPulse = useCallback((itemId) => {
    setPulsing((prev) => [...new Set([...prev, itemId])]);
  }, []);

  const stopPulse = useCallback((itemId) => {
    setPulsing((prev) => prev.filter((id) => id !== itemId));
  }, []);

  const triggerFlash = useCallback((itemId) => {
    // Clear any previous timeout for this item
    if (flashTimeoutRef.current[itemId]) {
      clearTimeout(flashTimeoutRef.current[itemId]);
    }

    // Start flash
    setEffectsById((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], flash: true },
    }));

    // Auto-clear after 1s (or match your CSS animation length)
    flashTimeoutRef.current[itemId] = setTimeout(() => {
      setEffectsById((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], flash: false },
      }));
      delete flashTimeoutRef.current[itemId];
    }, 1000); // match animation-duration
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
    [openItemId, triggerFlash, startPulse, stopPulse]
  );

  const handleNavigateBox = useCallback(
    (boxId) => onNavigateBox?.(boxId),
    [onNavigateBox]
  );
  const handleFlash = useCallback((id, effect) => {
    setEffectsById((prev) => ({ ...prev, [id]: effect }));
  }, []);

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

        {!loading && !error && activeTab === 'edit' && (
          <BoxEditPanel box={tree || {}} />
        )}
      </S.Content>
    </S.Wrap>
  );
}
