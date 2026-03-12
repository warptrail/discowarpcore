import React from 'react';
import * as S from './NestBoxSection.styles';

export default function NestContextCard({
  localBoxTree,
  sourceBoxShortId,
  parentChain,
  currentParentId,
  busy,
  directChildren,
  directChildShortIds,
  onUnnestToFloor,
  onReleaseChildrenToFloor,
}) {
  return (
    <S.ContextCard>
      <S.ContextTitle>
        <S.Pill>Working on</S.Pill>
        <span>
          {localBoxTree?.label ?? 'This box'}
          {sourceBoxShortId || localBoxTree?.box_id
            ? ` (#${sourceBoxShortId || localBoxTree?.box_id})`
            : ''}
        </span>
      </S.ContextTitle>

      <S.SubLabel>Parent path</S.SubLabel>
      <S.Breadcrumb>
        <S.Crumb>
          <strong>Path:</strong> <span>Floor</span>
        </S.Crumb>
        {parentChain.map((p) => (
          <React.Fragment key={String(p?._id || p?.box_id || Math.random())}>
            <S.Sep>→</S.Sep>
            <S.Crumb>
              <span>{p?.box_id ? `#${p.box_id}` : ''}</span>
              <span>{p?.label || p?.description || ''}</span>
            </S.Crumb>
          </React.Fragment>
        ))}
      </S.Breadcrumb>

      {!currentParentId && (
        <S.Hint>This box is already on the floor (no parent).</S.Hint>
      )}

      <S.ActionRow>
        <S.WarnBtn
          disabled={busy || !currentParentId}
          onClick={onUnnestToFloor}
          title={
            currentParentId
              ? 'Move this box to the floor (no parent)'
              : 'Already on the floor'
          }
        >
          Unnest to floor
        </S.WarnBtn>

        <S.WarnBtn
          disabled={busy || directChildren.length === 0}
          onClick={onReleaseChildrenToFloor}
          title={
            directChildren.length > 0
              ? 'Move this box’s direct child boxes to the floor (non-recursive)'
              : 'No direct child boxes to release'
          }
        >
          Release direct children to floor
        </S.WarnBtn>
      </S.ActionRow>

      <S.SubLabel>Direct children</S.SubLabel>
      <S.Breadcrumb>
        <S.Crumb>
          <strong>Children:</strong> <span>{directChildren.length}</span>
        </S.Crumb>

        {directChildShortIds.length > 0 && (
          <>
            <S.Sep>•</S.Sep>
            <S.Crumb>
              <span>{directChildShortIds.map((id) => `#${id}`).join(', ')}</span>
            </S.Crumb>
          </>
        )}
      </S.Breadcrumb>

      {directChildren.length === 0 && (
        <S.Hint>No direct child boxes inside this box.</S.Hint>
      )}
    </S.ContextCard>
  );
}
