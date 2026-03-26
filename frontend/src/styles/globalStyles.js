// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PAGE_GAP,
  MOBILE_PANEL_RADIUS,
  MOBILE_TOUCH_TARGET,
} from './tokens';

const GlobalStyles = createGlobalStyle`
  :root {
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
    font-family: 'Arial', sans-serif;
    background-color: #0f0f0f;
    color: white;
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

  /* You can add more universal rules here */
`;

export default GlobalStyles;
