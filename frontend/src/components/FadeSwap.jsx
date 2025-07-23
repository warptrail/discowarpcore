import styled, { css, keyframes } from 'styled-components';

// Define the fade-out animation
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

// Reusable conditional styling
const fadeStyles = ($isVisible) =>
  $isVisible
    ? css`
        animation: ${fadeOut} 2s ease-out forwards;
        display: inline-block;
      `
    : css`
        display: none;
      `;

// Styled span that fades out when $isVisible is true
const FadeSwap = styled.span`
  ${(props) => fadeStyles(props.$isVisible)}
`;

export default FadeSwap;
