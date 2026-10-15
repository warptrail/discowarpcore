import { css } from 'styled-components';
import * as Panel from './RetrievalItemPanel.styles';
import * as Overview from './RetrievalOverview.styles';
import * as Finder from '../InventoryQuickAnswer/FinderItemFocus.styles';

export const mobileDensity = css`
  @media (max-width: 700px) {
    ${Panel.Content} { padding: 12px; }
    ${Overview.Identity} { margin-bottom: 8px; padding-inline: 0; }
    ${Overview.Name} { font-size: 1.4rem; line-height: 1.15; }
    ${Overview.Facts} { margin: 2px 0 4px; gap: 4px 6px; font-size: .82rem; }
    ${Overview.Description} { font-size: .875rem; line-height: 1.4; }
    ${Overview.Tags} { margin-top: 4px; gap: 4px; font-size: .75rem;
      button, a { min-height: 32px; padding: 3px 5px; } }
    ${Overview.Grid} { grid-template-columns: minmax(0, 1fr); gap: 8px; align-items: start; }
    ${Overview.Photo}${Overview.Photo} { width: 72px; justify-self: start; border-radius: 8px;
      img { padding: 4px; } }
    ${Overview.EmptyPhoto}${Overview.EmptyPhoto} { padding: 4px; gap: 2px; font-size: .75rem; line-height: 1.2;
      svg { width: 18px; height: 18px; } }
    ${Overview.Placement} { padding: 8px; border-radius: 8px;
      ${Finder.BoxIdentity} { gap: 3px; margin-bottom: 6px; padding-bottom: 6px;
        strong { font-size: 1.4rem; } span { font-size: .82rem; } }
      ${Finder.Placement} > h3 { margin-bottom: 4px; font-size: .7rem; }
      ${Finder.RecordedNote} { font-size: .75rem; line-height: 1.35; }
      ${Finder.RecordedNote}:first-of-type { padding: 4px 6px; border-radius: 3px; }
      ${Finder.Tiers} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3px; }
      ${Finder.Tiers} > div {
        display: grid; grid-template-columns: 66px minmax(0, 1fr); align-items: center; gap: 4px;
        padding: 2px 4px; border-radius: 3px;
        border-color: rgba(var(--box-primary-rgb), .2); background: var(--dw-background);
      }
      ${Finder.Tiers} dt { margin: 0; font: 400 .68rem/1.25 var(--dw-font-data); }
      ${Finder.Tiers} dd { min-width: 0; font: 400 .75rem/1.3 var(--dw-font-data); }
      ${Finder.Tiers} dd[data-missing='true'] { font-size: .75rem; }
      ${Finder.Tiers} button { padding: 2px 0; border-radius: 2px; }
    }
  }
  @media (max-width: 360px) {
    ${Panel.Content} { padding: 10px; }
    ${Overview.Identity} { margin-bottom: 6px; }
    ${Overview.Grid} { gap: 6px; }
    ${Overview.Placement} ${Finder.Tiers} > div { grid-template-columns: minmax(0, 1fr); gap: 0; }
  }
`;
