import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';

export function getRetrievalItemPanelTheme(item) {
  // A compartment label is an address; its physical box number owns the palette.
  const theme = getBoxTheme(item?.boxNumber || item?.placementLabel);
  return {
    ...getBoxThemeCssVars(theme),
    '--retrieval-panel-accent': 'var(--box-neon)',
    '--prism-sheet-border': 'var(--retrieval-panel-accent)',
    '--prism-sheet-glow': '0 0 10px rgba(var(--box-primary-rgb), 0.32), 0 0 32px rgba(var(--box-primary-rgb), 0.18), 0 0 64px rgba(var(--box-primary-rgb), 0.1)',
    '--prism-sheet-top-edge': 'var(--retrieval-panel-accent)',
    '--prism-sheet-divider': 'rgba(var(--box-primary-rgb), 0.24)',
    '--prism-sheet-surface': 'radial-gradient(ellipse at 15% 0%, rgba(var(--box-primary-rgb), 0.07), transparent 70%), var(--dw-background)',
    '--prism-sheet-header-surface': 'linear-gradient(110deg, rgba(var(--box-primary-rgb), 0.07), transparent), var(--dw-background)',
  };
}
