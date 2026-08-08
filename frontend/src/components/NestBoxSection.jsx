import React from 'react';

import useNestBoxSectionData from './NestBoxSection/useNestBoxSectionData';
import NestContextCard from './NestBoxSection/NestContextCard';
import NestDestinationGrid from './NestBoxSection/NestDestinationGrid';
import * as S from './NestBoxSection/NestBoxSection.styles';
import { getBoxTheme, getBoxThemeCssVars } from '../util/inventoryColorTheme';

export default function NestBoxSection({
  open,
  sourceBoxMongoId,
  sourceBoxShortId,
  boxTree,
  onClose,
  onConfirm,
  onDidNest,
  onDidUnnest,
  onDidReleaseChildren,
  showClose = true,
}) {
  const {
    loading,
    error,
    busy,
    localBoxTree,
    parentChain,
    currentParentId,
    directChildren,
    directChildShortIds,
    depthById,
    visibleBoxes,
    selectedId,
    chooseDest,
    handleUnnestToFloor,
    handleReleaseChildrenToFloor,
  } = useNestBoxSectionData({
    open,
    sourceBoxMongoId,
    boxTree,
    onConfirm,
    onDidNest,
    onDidUnnest,
    onDidReleaseChildren,
  });

  const sourceTheme = getBoxTheme(sourceBoxShortId || localBoxTree?.box_id, {
    kind: 'system',
  });

  return (
    <S.NestPanel $open={open} style={getBoxThemeCssVars(sourceTheme)}>
      {open && (
        <S.SectionInner>
          <S.SectionHeader>
            <S.Title>
              Nest “{localBoxTree?.label ?? 'This box'}”
              {sourceBoxShortId || localBoxTree?.box_id
                ? ` (#${sourceBoxShortId || localBoxTree?.box_id})`
                : ''}{' '}
              in another box
            </S.Title>
            {showClose ? (
              <S.GhostBtn onClick={onClose} disabled={busy}>
                Back to manage
              </S.GhostBtn>
            ) : null}
          </S.SectionHeader>

          <NestContextCard
            localBoxTree={localBoxTree}
            sourceBoxShortId={sourceBoxShortId}
            parentChain={parentChain}
            currentParentId={currentParentId}
            busy={busy}
            directChildren={directChildren}
            directChildShortIds={directChildShortIds}
            onUnnestToFloor={handleUnnestToFloor}
            onReleaseChildrenToFloor={handleReleaseChildrenToFloor}
          />

          <S.Note style={{ marginBottom: 8 }}>Choose a destination box:</S.Note>

          <NestDestinationGrid
            loading={loading}
            error={error}
            visibleBoxes={visibleBoxes}
            busy={busy}
            selectedId={selectedId}
            depthById={depthById}
            onChooseDest={chooseDest}
          />
        </S.SectionInner>
      )}
    </S.NestPanel>
  );
}
