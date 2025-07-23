// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    background-color: #0f0f0f;
    color: white;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  /* You can add more universal rules here */
`;

export default GlobalStyles;
