import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import * as S from '../styles/BoxDetailView.styles';

import BoxMetaPanel from './BoxMetaPanel';
import TabControlBar from './TabControlBar';

import useBoxDetailData from './BoxDetailView/useBoxDetailData';
import useItemEffects from './BoxDetailView/useItemEffects';
import BoxDetailTabContent from './BoxDetailView/BoxDetailTabContent';
import BoxSearchOverlay from './BoxDetailView/BoxSearchOverlay';
import BoxManagementSheet from './BoxDetailView/BoxManagementSheet';
import useBoxWorkspaceSearch from './BoxDetailView/useBoxWorkspaceSearch';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../util/inventoryColorTheme';
import BoxActionPanel from './BoxActionPanel';
import {
  BOX_CONTEXT_STATE_EVENT,
} from '../constants/inventoryFinderEvents';

const VALID_TABS = new Set(['tree', 'flat', 'edit']);
const VALID_PANELS = new Set(['empty', 'nest', 'edit', 'export', 'destroy']);

export default function BoxDetailView({ parentPath, onNavigateBox }) {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [boxImageRefreshToken, setBoxImageRefreshToken] = useState(0);
  const [treeViewMode, setTreeViewMode] = useState('full');

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab');
    return VALID_TABS.has(tab) ? tab : 'flat';
  }, [searchParams]);

  const activePanel = useMemo(() => {
    if (activeTab !== 'edit') return null;
    const panel = searchParams.get('panel');
    return VALID_PANELS.has(panel) ? panel : null;
  }, [activeTab, searchParams]);

  const {
    tree,
    flatItems,
    parentPath: fetchedParentPath,
    stats,
    loading,
    error,
    handleItemSaved,
    refreshBox,
  } =
    useBoxDetailData(shortId);
  const search = useBoxWorkspaceSearch({ shortId, items: flatItems });
  const hasChildBoxes = Array.isArray(tree?.childBoxes) && tree.childBoxes.length > 0;
  const browseTab = activeTab === 'tree' ? 'tree' : 'flat';
  const managementOpen = activeTab === 'edit';
  const resultsRef = React.useRef(null);

  const {
    openItemId,
    pulsing,
    effectsById,
    accent,
    collapseDurMs,
    startPulse,
    stopPulse,
    triggerFlash,
    handleOpen,
    handleFlash,
  } = useItemEffects();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [shortId]);

  useEffect(() => {
    setTreeViewMode('full');
  }, [shortId]);

  useEffect(() => {
    if (!tree) return undefined;
    window.dispatchEvent(
      new CustomEvent(BOX_CONTEXT_STATE_EVENT, {
        detail: {
          shortId: String(tree?.box_id ?? tree?.shortId ?? ''),
          title: String(tree?.label ?? tree?.name ?? 'Box'),
          location: String(
            tree?.location ?? tree?.locationName ?? tree?.locationId?.name ?? ''
          ).trim(),
        },
      })
    );
    return () => window.dispatchEvent(new CustomEvent(BOX_CONTEXT_STATE_EVENT, { detail: null }));
  }, [tree]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const panel = searchParams.get('panel');
    const next = new URLSearchParams(searchParams);
    let shouldNormalize = false;

    if (tab && !VALID_TABS.has(tab)) {
      next.delete('tab');
      shouldNormalize = true;
    }

    if (next.get('tab') !== 'edit') {
      if (panel !== null) {
        next.delete('panel');
        shouldNormalize = true;
      }
    } else if (panel && !VALID_PANELS.has(panel)) {
      next.delete('panel');
      shouldNormalize = true;
    }

    if (shouldNormalize) {
      setSearchParams(next, { replace: true });
    }
  }, [hasChildBoxes, searchParams, setSearchParams, tree]);

  const handleTabChange = useCallback(
    (mode) => {
      if (!VALID_TABS.has(mode)) return;

      const next = new URLSearchParams(searchParams);
      if (mode === 'flat') {
        next.delete('tab');
      } else {
        next.set('tab', mode);
      }

      if (mode !== 'edit') {
        next.delete('panel');
      }

      if (next.toString() === searchParams.toString()) return;
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handlePanelChange = useCallback(
    (panel) => {
      const next = new URLSearchParams(searchParams);

      if (activeTab !== 'edit') {
        if (!next.has('panel')) return;
        next.delete('panel');
      } else if (panel && VALID_PANELS.has(panel)) {
        next.set('panel', panel);
      } else {
        next.delete('panel');
      }

      if (next.toString() === searchParams.toString()) return;
      setSearchParams(next, { replace: true });
    },
    [activeTab, searchParams, setSearchParams],
  );

  const handleManageBox = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'edit');
    next.delete('panel');

    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleCloseManagement = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    next.delete('panel');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSearchCommit = useCallback(() => {
    search.minimize();
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [search]);

  const handleNavigateBox = useCallback(
    (boxId) => {
      const nextShortId = String(boxId ?? '').trim();
      if (!nextShortId) return;
      if (typeof onNavigateBox === 'function') {
        onNavigateBox(nextShortId);
        return;
      }
      const nextSearch = new URLSearchParams();
      if (activeTab === 'tree') nextSearch.set('tab', 'tree');
      navigate({
        pathname: `/boxes/${encodeURIComponent(nextShortId)}`,
        search: nextSearch.toString() ? `?${nextSearch.toString()}` : '',
      });
    },
    [activeTab, navigate, onNavigateBox],
  );
  const resolvedParentPath = Array.isArray(parentPath)
    ? parentPath
    : fetchedParentPath;

  const boxThemeStyle = getBoxThemeCssVars(getBoxTheme(shortId));

  return (
    <S.Wrap style={boxThemeStyle}>
      <S.Content>
        {tree && (
          <>
            <BoxMetaPanel
              box={tree}
              parentPath={resolvedParentPath}
              onNavigateBox={handleNavigateBox}
              stats={stats}
              imageRefreshToken={boxImageRefreshToken}
            />
            <TabControlBar
              mode={browseTab}
              onChange={handleTabChange}
              busy={!!loading}
              showTree={Boolean(tree)}
              hasChildBoxes={hasChildBoxes}
              viewMode={treeViewMode}
              onViewModeChange={setTreeViewMode}
            />
          </>
        )}

        {loading && <S.Spinner />}
        {error && <S.ErrorBanner>{String(error)}</S.ErrorBanner>}

        <S.TabViewport ref={resultsRef}>
          <BoxDetailTabContent
            activeTab={browseTab}
            loading={loading}
            error={error}
            tree={tree}
            flatItems={search.visibleItems}
            openItemId={openItemId}
            handleOpen={handleOpen}
            accent={accent}
            pulsing={pulsing}
            collapseDurMs={collapseDurMs}
            effectsById={effectsById}
            triggerFlash={triggerFlash}
            startPulse={startPulse}
            stopPulse={stopPulse}
            handleFlash={handleFlash}
            handleItemSaved={handleItemSaved}
            refreshBox={refreshBox}
            searchQuery={search.query}
            sortMode={search.sortMode}
            onManageBox={handleManageBox}
            viewMode={treeViewMode}
          />
        </S.TabViewport>
        {tree ? (
          <>
            <BoxSearchOverlay
              mode={search.mode}
              shortId={shortId}
              query={search.query}
              onQueryChange={search.setQuery}
              sortMode={search.sortMode}
              onSortChange={search.setSortMode}
              sortDirection={search.sortDirection}
              onSortDirectionChange={search.setSortDirection}
              matchCount={search.matchCount}
              onMinimize={search.minimize}
              onClear={search.clear}
              onCommit={handleSearchCommit}
            />
            <BoxManagementSheet
              open={managementOpen}
              boxId={shortId}
              title={tree?.label ?? tree?.name ?? 'Box'}
              onClose={handleCloseManagement}
            >
              <BoxActionPanel
                box={tree}
                boxTree={tree}
                boxMongoId={tree._id}
                refreshBox={refreshBox}
                activePanelState={activePanel}
                onActivePanelStateChange={handlePanelChange}
                onImageStateChanged={() => setBoxImageRefreshToken(Date.now())}
              />
            </BoxManagementSheet>
          </>
        ) : null}
      </S.Content>
    </S.Wrap>
  );
}
