import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import * as S from '../styles/BoxDetailView.styles';

import BoxMetaPanel from './BoxMetaPanel';
import TabControlBar from './TabControlBar';

import useBoxDetailData from './BoxDetailView/useBoxDetailData';
import useItemEffects from './BoxDetailView/useItemEffects';
import BoxDetailTabContent from './BoxDetailView/BoxDetailTabContent';

export default function BoxDetailView({ parentPath, onNavigateBox }) {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tree');

  const {
    tree,
    flatItems,
    parentPath: fetchedParentPath,
    stats,
    loading,
    error,
    handleItemSaved,
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

  const handleTabChange = useCallback((mode) => setActiveTab(mode), []);
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
          />
        </S.TabViewport>
      </S.Content>
    </S.Wrap>
  );
}
