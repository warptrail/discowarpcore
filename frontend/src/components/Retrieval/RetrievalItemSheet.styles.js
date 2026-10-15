import styled from 'styled-components';
import ObsidianPrismSheet from '../Sheets/ObsidianPrismSheet';
import { frameCorners } from './RetrievalFrame.styles';
import { desktopDensity } from './RetrievalDesktopDensity.styles';
import { mobileDensity } from './RetrievalMobileDensity.styles';

export default styled(ObsidianPrismSheet)`
  &&& {
    border: 1px solid var(--prism-sheet-border); border-radius: 18px 18px 14px 14px;
    box-shadow: var(--prism-sheet-glow), inset 0 1px 0 rgba(255,255,255,.16),
      inset 0 -2px 0 rgba(0,0,0,.55), 0 3px 0 rgba(var(--box-primary-rgb), .18), 0 24px 80px rgba(0, 0, 0, .7);
  }
  [data-prism-sheet-header] > button { color: var(--box-secondary); }
  ${frameCorners}
  &[data-prism-header-variant='handle'] [data-prism-sheet-header] {
    height: 24px; min-height: 24px;
    &::after { top: 10px; width: 42px; height: 4px; background: rgba(var(--box-primary-rgb), .6); }
    > button:last-child { top: 28px; right: 10px; width: 64px; height: 72px;
      border-left: 1px solid var(--prism-sheet-divider); font-size: 1.5rem; }
  }
  @media (min-width: 1100px) {
    &&& { width: min(605px, calc(100vw - 64px)); height: min(547px, calc(100dvh - 80px)); }
  }
  @media (max-width: 700px) {
    &&& { border-radius: 12px 12px 0 0; }
    &[data-prism-header-variant='handle'] [data-prism-sheet-header] {
      height: 16px; min-height: 16px;
      &::after { top: 6px; width: 32px; height: 3px; }
      > button:last-child { top: 21px; right: 4px; width: 44px; height: 44px; font-size: 1.12rem; }
    }
  }
  ${desktopDensity}
  ${mobileDensity}
`;
