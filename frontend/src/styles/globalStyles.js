// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';
import {
  APP_VISUAL_THEME,
  APP_GEOMETRY,
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PAGE_GAP,
  MOBILE_PANEL_RADIUS,
  MOBILE_TOUCH_TARGET,
} from './tokens';

const GlobalStyles = createGlobalStyle`
  :root {
    --dw-background: ${APP_VISUAL_THEME.background};
    --dw-surface: ${APP_VISUAL_THEME.surface};
    --dw-surface-raised: ${APP_VISUAL_THEME.surfaceRaised};
    --dw-border: ${APP_VISUAL_THEME.border};
    --dw-border-soft: ${APP_VISUAL_THEME.borderSoft};
    --dw-text: ${APP_VISUAL_THEME.text};
    --dw-text-secondary: ${APP_VISUAL_THEME.textSecondary};
    --dw-text-muted: ${APP_VISUAL_THEME.textMuted};
    --dw-cyan: ${APP_VISUAL_THEME.cyan};
    --dw-teal: ${APP_VISUAL_THEME.teal};
    --dw-violet: ${APP_VISUAL_THEME.violet};
    --dw-amber: ${APP_VISUAL_THEME.amber};
    --dw-coral: ${APP_VISUAL_THEME.coral};
    --dw-radius: ${APP_GEOMETRY.radius};
    --dw-radius-sm: ${APP_GEOMETRY.radiusSmall};
    --dw-control-height: ${APP_GEOMETRY.controlHeight};
    --dw-font-ui: ${APP_GEOMETRY.fontUI};
    --dw-font-data: ${APP_GEOMETRY.fontData};
    --dw-shadow: ${APP_GEOMETRY.shadow};
    color-scheme: dark;
    --mobile-gap: ${MOBILE_PAGE_GAP};
    --mobile-radius: ${MOBILE_PANEL_RADIUS};
    --mobile-font-sm: ${MOBILE_FONT_SM};
    --mobile-font-xs: ${MOBILE_FONT_XS};
    --mobile-touch-target: ${MOBILE_TOUCH_TARGET};
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    min-height: 100%;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: var(--dw-font-ui);
    background-color: var(--dw-background);
    color: var(--dw-text);
    overflow-x: clip;
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -webkit-text-size-adjust: 100%;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button, a, input, select, textarea { -webkit-tap-highlight-color: transparent; }
  button { touch-action: manipulation; }
  input, select, textarea { accent-color: var(--dw-cyan); }
  input::placeholder, textarea::placeholder { color: var(--dw-text-muted); }
  img { max-width: 100%; }
  [id] { scroll-margin-top: var(--dw-header-height, 160px); }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    body {
      font-size: 15px;
    }

    input,
    textarea,
    select {
      font-size: 16px !important;
    }
  }

  :focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 3px;
  }

  ::selection {
    background: rgba(127, 215, 255, 0.24);
    color: var(--dw-text);
  }
`;

export default GlobalStyles;
