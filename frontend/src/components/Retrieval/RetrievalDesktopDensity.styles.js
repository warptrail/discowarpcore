import { css } from 'styled-components';
import * as Panel from './RetrievalItemPanel.styles';
import * as Overview from './RetrievalOverview.styles';
import * as Finder from '../InventoryQuickAnswer/FinderItemFocus.styles';

// Keep the desktop dossier readable at its smaller size without scaling hit targets.
export const desktopDensity = css`
  @media (min-width: 1100px) {
    &[data-prism-header-variant='handle'] [data-prism-sheet-header] {
      height: 16px; min-height: 16px;
      &::after { top: 6px; width: 32px; height: 3px; }
      > button:last-child { top: 20px; right: 4px; width: 44px; height: 48px; font-size: 1.2rem; }
    }
    ${Panel.Tabs} { padding: 3px 4px; }
    &[data-prism-header-variant='handle'] ${Panel.Tabs} { padding-right: 52px; }
    ${Panel.Tab} { height: 48px; gap: 3px; font-size: .8rem;
      svg { width: 18px; height: 18px; } }
    ${Panel.Content} { padding: 14px 16px; }
    ${Panel.Footer} { min-height: 52px; padding: 4px 16px;
      a { font-size: .85rem; } }
    ${Overview.Identity} { margin-bottom: 8px; padding-inline: 0; }
    ${Overview.Name} { font-size: 1.7rem; line-height: 1.15; }
    ${Overview.Facts} { margin: 2px 0 4px; gap: 4px 6px; font-size: .85rem;
      button { min-height: 28px; } }
    ${Overview.Description} { font-size: .85rem; line-height: 1.4; }
    ${Overview.Tags} { margin-top: 4px; gap: 5px; font-size: .75rem;
      button, a { min-height: 28px; padding: 4px 6px; } }
    ${Overview.Grid} { grid-template-columns: minmax(0, 180px) minmax(0, 1fr); gap: 12px; }
    ${Overview.EmptyPhoto} { gap: 8px; padding: 12px; font-size: .8rem;
      svg { width: 44px; height: 44px; } }
    ${Overview.Placement} { padding: 12px;
      ${Finder.BoxIdentity} { gap: 3px; margin-bottom: 6px; padding-bottom: 6px;
        strong { font-size: 1.7rem; } span { font-size: .9rem; } }
      ${Finder.Placement} > h3 { margin-bottom: 6px; font-size: .75rem; }
      ${Finder.RecordedNote} { font-size: .8rem; }
      ${Finder.RecordedNote}:first-of-type { padding: 6px 8px; }
      ${Finder.Tiers} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
      ${Finder.Tiers} > div { display: grid; grid-template-columns: minmax(56px, .7fr) minmax(0, 1fr);
        align-items: center; gap: 4px; padding: 4px; }
      ${Finder.Tiers} dt { margin-bottom: 0; font-size: .7rem; }
      ${Finder.Tiers} dd { font-size: .8rem; }
    }
  }
`;
