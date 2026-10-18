import styled, { css } from 'styled-components';
import { styledComponents as S } from '../../styles/BoxList.styles';

export const DesktopItemCount = styled.span`
  display: none;
  @media (min-width: 1100px) {
    display: block;
    justify-self: end;
    align-self: center;
    color: var(--dw-text-secondary);
    font: 400 .75rem/20px var(--dw-font-data);
    opacity: 0.65;
    white-space: nowrap;
  }
`;

// Scoped to Cards on desktop; Terminal and the mobile tree retain their layout.
export const desktopCardLayout = css`
  ${S.BoxCard}, ${S.OrphanedAttentionLink} {
    height: 160px;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  ${S.BoxCard}[data-has-field-actions] {
    grid-template-rows: minmax(0, 1fr) 40px;
  }
  ${S.BoxBodyRow} { min-height: 0; overflow: hidden; }
  ${S.BoxContent} { padding: 8px 10px 8px 8px; overflow: hidden; }
  ${S.BoxHeader} {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: 20px 36px;
    align-items: start;
    gap: 2px 8px;
    min-height: 58px;
  }
  ${S.ShortId} { align-self: center; font-size: .8rem; }
  ${S.BoxTitle} {
    grid-column: 1 / -1;
    white-space: normal;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    line-height: 18px;
  }
  ${S.BoxMetaRow} { height: 22px; box-sizing: border-box; overflow: hidden; }
  ${S.LocationMeta} { display: flex; gap: 5px; font-size: .75rem; width: 100%; }
  ${S.LocationMetaLabel} { flex: 0 0 auto; }
  ${S.LocationMetaValue} { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  ${S.TagRow} { flex-wrap: nowrap; height: 20px; padding: 0; max-width: 100%; overflow: hidden; }
  ${S.TagBubble} { display: block; flex: 0 1 auto; min-width: 0; line-height: 20px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  ${S.SecondaryMeta}, ${S.BoxSummary} { display: none; }
  ${S.CardManifest} { display: none; }
  ${S.OrphanedSignal} { width: 80px; height: 80px; min-height: 0; margin: 0 0 0 8px; border: 0; border-radius: var(--dw-radius-sm); }
  ${S.OrphanedAttentionLink} ${S.BoxBodyRow} { align-items: center; }
  ${S.OrphanedAttentionLink}, ${S.OrphanedAttentionLink} ${S.BoxBodyRow} { overflow: visible; }
  ${S.OrphanedAttentionCopy} {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 8px;
  }
  ${S.OrphanedAttentionTitle}, ${S.OrphanedAttentionMeta} { grid-column: 1 / -1; }
  ${S.OrphanedAttentionMeta} { white-space: normal; line-height: 18px; }
  ${S.OrphanedAttentionLink}[data-has-search-matches] {
    height: 284px;
    ${S.OrphanedAttentionCopy} > div { grid-column: 1 / -1; max-height: 144px; overflow: auto; }
  }
  ${S.NodeChildren} { margin-left: 8px; }
  ${S.BoxCard}[data-has-search-matches] {
    height: 284px;
    grid-template-rows: minmax(0, 1fr) 144px;
    ${S.BoxContent} { padding: 4px 6px; }
    ${S.BoxHeader} { grid-template-rows: 20px 32px; min-height: 54px; gap: 2px 6px; }
    ${S.BoxTitle} { line-height: 16px; }
    ${S.BoxMetaRow} { height: 18px; padding: 0; }
    ${S.LocationMetaLabel} { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    ${S.LocationMetaValue} { line-height: 14px; }
  }
  ${S.BoxCard}[data-has-field-actions][data-has-search-matches] {
    grid-template-rows: minmax(0, 1fr) 144px 40px;
  }
`;

// Section cards keep their full address and owner context readable at desktop density.
export const desktopSectionLayout = css`
  ${S.BoxCard}[data-result-kind='cabinet'] {
    height: auto;
    min-height: 160px;
    ${S.BoxHeader} { grid-template-rows: 20px auto; min-height: 0; }
    ${S.BoxTitle} { display: block; overflow: visible; -webkit-line-clamp: unset; }
    ${S.SecondaryMeta} { display: block; white-space: normal; overflow-wrap: anywhere; line-height: 1.4; }
  }
`;
