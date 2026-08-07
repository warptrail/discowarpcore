import React from 'react';

import BoxInlineItemActions from './BoxInlineItemActions';
import * as S from './BoxDetailTabContent.styles';

export default function BoxDetailActionSection({
  title,
  count,
  box,
  onItemsChanged,
  onManageBox,
  children,
}) {
  return (
    <S.DetailActionSection>
      <S.SectionHeading>
        <S.SectionTitle>{title}</S.SectionTitle>
        {count !== undefined && count !== null ? (
          <S.SectionCount>
            {count} {count === 1 ? 'item' : 'items'}
          </S.SectionCount>
        ) : null}
        {typeof onManageBox === 'function' ? (
          <S.SectionManageButton type="button" onClick={onManageBox} aria-label="Manage box">
            <S.ManageDot $i={0} />
            <S.ManageDot $i={1} />
            <S.ManageDot $i={2} />
            <S.ManageDot $i={3} />
          </S.SectionManageButton>
        ) : null}
        <S.SectionRule aria-hidden="true" />
      </S.SectionHeading>
      <BoxInlineItemActions box={box} onItemsChanged={onItemsChanged} />
      {children}
    </S.DetailActionSection>
  );
}
