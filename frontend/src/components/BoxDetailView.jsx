// src/components/BoxDetailView.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchBoxDataStructure } from '../api/boxes';

// Child components (must be default exports)
import TabControlBar from './TabControlBar';
import BoxMetaPanel from './BoxMetaPanel';
import BoxTree from './BoxTree';
import ItemsFlatList from './ItemsFlatList';
import BoxEditPanel from './BoxEditPanel';

// Styles (Wrap, Spinner, ErrorBanner)
import * as S from '../styles/BoxDetailView.styles';

// ----------- Animations ----------

// Global default look
const DEFAULT_ACCENT = '#4CC6C1';
const DEFAULT_COLLAPSE_MS = 520;

// 3-pulse timing: if your CSS pulse is 600ms per cycle, 3x = 1800ms
const PULSE_CYCLE_MS = 600;
const PULSE_REPEAT = 3;
const PULSE_TOTAL_MS = PULSE_CYCLE_MS * PULSE_REPEAT + 150; // small buffer
// Map of “kinds” to colors
const FLASH_COLORS = {
  edit: '#36c26e', // green
  cancel: '#ffd166', // yellow
  move: '#5aa5ff', // blue
  error: '#ff4d4f', // red
};

export default function BoxDetailView() {
  const { shortId } = useParams();
  const navigate = useNavigate();

  // ---------- Minimal state ----------
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'flat' | 'edit'
  const [data, setData] = useState(null); // { tree, ancestors?, flatItems?, stats? }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openItemId, setOpenItemId] = useState(null); // used by ItemRow toggles
  // list-level appearance (user toggle-able if you want)
  const [listMode, setListMode] = useState('default'); // 'default' | 'compact'
  const [effectsById, setEffectsById] = useState({});

  // If you want pulsing to reflect a recent action, drive it off your own state.
  // For now, just default false:
  const pulsing = false;

  // Accent can be static for the whole view, or vary by box
  const accent = DEFAULT_ACCENT;
  const collapseDurMs = DEFAULT_COLLAPSE_MS;

  // ---------- Derivations ----------
  const tree = data?.tree || null;
  const flatItems = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.flatItems)) return data.flatItems;
    if (Array.isArray(data.items)) return data.items;
    // If you have a flatten util and only a tree arrives, you can do it here:
    // if (data.tree) return flattenBoxes(data.tree);
    return [];
  }, [data]);

  const itemsForTree = flatItems; // pass same list into BoxTree if useful

  const parentPath = useMemo(
    () =>
      (data?.ancestors || []).map((a) => ({ id: a.box_id, label: a.label })),
    [data?.ancestors]
  );

  // toggle-aware open handler (your original logic) with stable identity
  const handleOpen = useCallback((idOrNull) => {
    setOpenItemId((prev) =>
      idOrNull == null ? null : prev === idOrNull ? null : idOrNull
    );
  }, []);

  // compute mode for a given row id (minimal if that row is open)
  const modeFor = useCallback(
    (id) => (id === openItemId ? 'minimal' : listMode),
    [openItemId, listMode]
  );

  // Optional: cheap guards to help you spot unexpected shapes during dev
  useEffect(() => {
    if (data && !tree)
      console.warn('BoxDetailView: data present but no tree', data);
  }, [data, tree]);

  // Reset when the route shortId changes
  useEffect(() => {
    setActiveTab('tree');
    setData(null);
    setError(null);
    setOpenItemId(null);
  }, [shortId]);

  // One fetch on mount for this box id: get everything needed for both tabs
  useEffect(() => {
    if (!shortId) return;

    const ac = new AbortController();
    let active = true;

    // show spinner immediately; clear any prior error
    setLoading(true);
    setError(null);
    // NOTE: don't clear data here if you want to keep stale content visible during refetch
    // If you prefer blank + spinner, uncomment the next line:
    // setData(null);

    (async () => {
      try {
        const payload = await fetchBoxDataStructure(shortId, {
          ancestors: true, // breadcrumb for meta panel
          flat: 'items', // server-provided flat list for ItemsFlatList
          stats: true, // counts for meta panel
          signal: ac.signal,
        });

        if (!active) return;

        if (payload) {
          setData(payload);
        } else {
          // Only mark not found after request completes
          setData(null);
          setError('Box not found');
        }
      } catch (err) {
        if (!active || err?.name === 'AbortError' || ac.signal.aborted) return;
        setData(null);
        setError(err?.message || 'Failed to load box');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      ac.abort();
    };
  }, [shortId]);

  // Navigate to a different box by short id (used by BoxMetaPanel)
  const handleNavigateBox = (sid) => {
    if (!sid) return;
    navigate(`/boxes/${sid}`);
  };

  // Normalize whatever TabControlBar passes (string, {key}, {value}, event.target.value)
  const handleTabChange = (nextMode) => {
    // TabControlBar seems to send "tree" | "items" | "edit"
    // We render using "tree" | "flat" | "edit"
    if (nextMode === 'items') {
      setActiveTab('flat');
    } else if (
      nextMode === 'tree' ||
      nextMode === 'edit' ||
      nextMode === 'flat'
    ) {
      setActiveTab(nextMode);
    }
  };

  // Called by ItemDetails via props to simulate a visual flash on a row
  const handleFlash = useCallback((itemId, kind = 'edit') => {
    const color = FLASH_COLORS[kind] ?? DEFAULT_ACCENT;
    setEffectsById((m) => ({
      ...m,
      [itemId]: { accent: color, pulsing: true },
    }));

    // auto-clear after 3 pulses
    window.setTimeout(() => {
      setEffectsById((m) => {
        const next = { ...m };
        delete next[itemId];
        return next;
      });
    }, PULSE_TOTAL_MS);
  }, []);

  // ------------ Loading & Error Render -----------

  if (loading) return <S.Spinner label={`Loading box ${shortId}…`} />;
  if (error) return <S.ErrorBanner title="Error" message={error} />;
  // now safe to assume data (or render a neutral empty state)

  // ---------- Render ----------
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
            tree={tree}
            items={itemsForTree} // <-- array (safe)
            openItemId={openItemId}
            onOpenItem={handleOpen}
            modeFor={modeFor}
            accent={accent}
            pulsing={pulsing}
            collapseDurMs={collapseDurMs}
            effectsById={effectsById}
            onFlash={handleFlash}
          />
        )}

        {!loading && !error && tree && activeTab === 'flat' && (
          <ItemsFlatList
            items={flatItems}
            openItemId={openItemId}
            onOpenItem={handleOpen}
            modeFor={modeFor}
            accent={accent}
            pulsing={pulsing}
            collapseDurMs={collapseDurMs}
            effectsById={effectsById}
            onFlash={handleFlash}
          />
        )}

        {!loading && !error && activeTab === 'edit' && (
          <BoxEditPanel box={{}} />
        )}
      </S.Content>
    </S.Wrap>
  );
}
