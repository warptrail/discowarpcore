import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import * as S from '../styles/BoxDetailView.styles';

import BoxMetaPanel from './BoxMetaPanel';
import TabControlBar from './TabControlBar';

import useBoxDetailData from './BoxDetailView/useBoxDetailData';
import useItemEffects from './BoxDetailView/useItemEffects';
import BoxDetailTabContent from './BoxDetailView/BoxDetailTabContent';

const VALID_TABS = new Set(['tree', 'flat', 'edit']);
const VALID_PANELS = new Set(['empty', 'nest', 'edit', 'export', 'destroy']);

export default function BoxDetailView({ parentPath, onNavigateBox }) {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab');
    return VALID_TABS.has(tab) ? tab : 'tree';
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
  }, [searchParams, setSearchParams]);

  const handleTabChange = useCallback(
    (mode) => {
      if (!VALID_TABS.has(mode)) return;

      const next = new URLSearchParams(searchParams);
      if (mode === 'tree') {
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

  const handleNavigateBox = useCallback(
    (boxId) => {
      const nextShortId = String(boxId ?? '').trim();
      if (!nextShortId) return;
      if (typeof onNavigateBox === 'function') {
        onNavigateBox(nextShortId);
        return;
      }
      navigate(`/boxes/${encodeURIComponent(nextShortId)}`);
    },
    [navigate, onNavigateBox],
  );
  const resolvedParentPath = Array.isArray(parentPath)
    ? parentPath
    : fetchedParentPath;

  return (
    <S.Wrap>
      <S.Content>
        {tree && (
          <>
            <BoxMetaPanel
              box={tree}
              parentPath={resolvedParentPath}
              onNavigateBox={handleNavigateBox}
              stats={stats}
            />
            <TabControlBar
              mode={activeTab}
              onChange={handleTabChange}
              busy={!!loading}
            />
          </>
        )}

        {loading && <S.Spinner />}
        {error && <S.ErrorBanner>{String(error)}</S.ErrorBanner>}

        <S.TabViewport key={`tab-${activeTab}`}>
          <BoxDetailTabContent
            activeTab={activeTab}
            loading={loading}
            error={error}
            tree={tree}
            flatItems={flatItems}
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
            activePanel={activePanel}
            onActivePanelChange={handlePanelChange}
          />
        </S.TabViewport>
      </S.Content>
    </S.Wrap>
  );
}
