// src/components/BoxDetailView.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
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

export default function BoxDetailView() {
  const { shortId } = useParams();
  const navigate = useNavigate();

  // ---------- Minimal state ----------
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'flat' | 'edit'
  const [data, setData] = useState(null); // { tree, ancestors?, flatItems?, stats? }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openItemId, setOpenItemId] = useState(null); // used by ItemRow toggles
  const [pulsingItems, setPulsingItems] = useState([]);
  const accent = 'blue'; // or however you choose this
  const collapseDurMs = 300; // consistent animation speed

  // ---------- Derivations ----------
  const tree = data?.tree || null;
  const flatItems = data?.flatItems || [];
  const parentPath = useMemo(
    () =>
      (data?.ancestors || []).map((a) => ({ id: a.box_id, label: a.label })),
    [data?.ancestors]
  );

  // Reset when the route shortId changes
  useEffect(() => {
    setActiveTab('tree');
    setData(null);
    setError(null);
    setOpenItemId(null);
  }, [shortId]);

  const handleOpen = (idOrNull) => {
    setOpenItemId((prev) =>
      idOrNull == null ? null : prev === idOrNull ? null : idOrNull
    );
  };

  const pulseTimerRef = useRef(null);
  const stopPulseTimerRef = useRef(null);

  const handleTogglePulse = (itemId) => {
    // clear existing timers
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    if (stopPulseTimerRef.current) clearTimeout(stopPulseTimerRef.current);

    // close the details panel
    setOpenItemId(null);

    // wait a bit before pulsing
    pulseTimerRef.current = setTimeout(() => {
      // ✅ always set as an array
      setPulsingItems([String(itemId)]);

      // optional: stop pulsing after 3s
      stopPulseTimerRef.current = setTimeout(() => {
        setPulsingItems([]); // ✅ back to empty array
      }, 3000);
    }, 1000);
  };

  const handlePulseBox = (box) => {
    const itemIds = box.items.map((i) => i._id);

    setPulsingItems(itemIds); // ✅ all rows in this box pulse

    stopPulseTimerRef.current = setTimeout(() => {
      setPulsingItems([]);
    }, 3000);
  };

  // Clean up timers on unmount
  useEffect(
    () => () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      if (stopPulseTimerRef.current) clearTimeout(stopPulseTimerRef.current);
    },
    []
  );

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

            {/* Your styled TabControlBar. We pass both prop name styles to be safe. */}
            <TabControlBar
              mode={activeTab}
              onChange={handleTabChange}
              busy={loading}
            />
          </>
        )}

        {/* Status */}
        {loading && <S.Spinner />}
        {error && <S.ErrorBanner>{error}</S.ErrorBanner>}

        {/* Content */}
        {!loading && !error && tree && activeTab === 'tree' && (
          <BoxTree
            tree={tree}
            openItemId={openItemId}
            onOpenItem={handleOpen}
            accent={accent}
            pulsingItems={pulsingItems}
            onTogglePulse={handleTogglePulse}
            collapseDurMs={collapseDurMs}
          />
        )}

        {!loading && !error && tree && activeTab === 'flat' && (
          <ItemsFlatList
            items={flatItems}
            openItemId={openItemId}
            onOpenItem={handleOpen}
            accent={accent}
            pulsingItems={pulsingItems}
            onTogglePulse={handleTogglePulse}
            collapseDurMs={collapseDurMs}
          />
        )}

        {/* Optional third tab */}
        {!loading && !error && tree && activeTab === 'edit' && (
          <BoxEditPanel box={tree} />
        )}
      </S.Content>
    </S.Wrap>
  );
}
