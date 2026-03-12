import React from 'react';
import * as S from './NestBoxSection.styles';

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
        {visibleBoxes.map((b) => (
          <S.BoxBtn
            key={b._id}
            $selected={selectedId === b._id}
            $disabled={busy}
            disabled={busy}
            onClick={() => onChooseDest(b)}
            title={`Nest into ${b.label} (#${b.box_id})`}
          >
            <div style={{ fontWeight: 700 }}>{b.label}</div>
            <S.Meta>
              #{b.box_id} &middot; {b._id}
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
