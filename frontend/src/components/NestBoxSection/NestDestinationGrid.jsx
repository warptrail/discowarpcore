import { getLeafCompartments, compartmentLabel } from '../../util/boxCompartments';
import React from 'react';
import * as S from './NestBoxSection.styles';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';

export default function NestDestinationGrid({
  loading,
  error,
  visibleBoxes,
  busy,
  selectedId,
  depthById,
  onChooseDest,
}) {
  if (loading) return <S.Note>Loading boxes…</S.Note>;

  return (
    <>
      <S.Grid>
        {visibleBoxes.flatMap((box) => box.isComplexBox ? getLeafCompartments(box).map((leaf) => ({ ...box, _placementKey: leaf.key, _placementLabel: compartmentLabel(leaf) })) : [box]).map((b) => (
          <S.BoxBtn
            key={`${b._id}:${b._placementKey || ""}`}
            style={getBoxThemeCssVars(getBoxTheme(b.box_id))}
            $selected={selectedId === b._id}
            $disabled={busy}
            disabled={busy}
            onClick={() => onChooseDest(b, b._placementKey)}
            title={`Nest into ${b.label} (#${b.box_id}${b._placementKey || ''})`}
          >
            <div style={{ fontWeight: 700 }}>{b.label}</div>
            <S.Meta>
              #{b.box_id}{b._placementKey || ""}{b._placementLabel ? ` · ${b._placementLabel}` : ""}
            </S.Meta>
            {(() => {
              const depth = depthById.get(String(b._id)) ?? 0;
              const capped = Math.min(depth, 6);
              if (depth <= 0) return null;

              return (
                <S.DepthStrip title={`Nesting depth: ${depth}`}>
                  {Array.from({ length: capped }).map((_, i) => (
                    <S.DepthSeg key={i} $level={i + 1} />
                  ))}
                  {depth > 6 && (
                    <S.DepthSeg $level={7} title={`Nesting depth: ${depth}`} />
                  )}
                </S.DepthStrip>
              );
            })()}
          </S.BoxBtn>
        ))}

        {visibleBoxes.length === 0 && !loading && !error && (
          <S.Note>No available boxes to nest into.</S.Note>
        )}
      </S.Grid>
    </>
  );
}
