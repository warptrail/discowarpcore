import React from 'react';

import BoxInlineItemActions from './BoxInlineItemActions';
import * as S from './BoxDetailTabContent.styles';

export default function BoxDetailActionSection({
  title,
  count,
  box,
  onItemsChanged,
  onManageBox,
  headerAction,
  scopeNote,
  hideInlineActions = false,
  children,
}) {
  return (
    <S.DetailActionSection>
      <S.SectionHeading>
        <S.SectionIdentity>
          <S.SectionTitle>{title}</S.SectionTitle>
          {count !== undefined && count !== null ? (
            <S.SectionCount title={`${count} ${count === 1 ? 'item' : 'items'}`}>
              <S.SectionCountCompact aria-hidden="true">{count}</S.SectionCountCompact>
              <S.SectionCountFull>{count} {count === 1 ? 'item' : 'items'}</S.SectionCountFull>
            </S.SectionCount>
          ) : null}
          {scopeNote ? <S.SectionNote>{scopeNote}</S.SectionNote> : null}
        </S.SectionIdentity>
        {headerAction || typeof onManageBox === 'function' ? (
          <S.SectionCommands role="group" aria-label="Box inventory commands">
            {headerAction}
            {typeof onManageBox === 'function' ? (
              <S.SectionManageButton type="button" onClick={onManageBox} aria-label="Manage box" title="Manage box">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" />
                </svg>
              </S.SectionManageButton>
            ) : null}
          </S.SectionCommands>
        ) : null}
      </S.SectionHeading>
      {!hideInlineActions ? <BoxInlineItemActions box={box} onItemsChanged={onItemsChanged} /> : null}
      {children}
    </S.DetailActionSection>
  );
}
