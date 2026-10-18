import styled from 'styled-components';

const Icon = styled.img`
  display: block;
  flex-shrink: 0;
  width: var(--home-icon-size, clamp(1.55rem, 5vw, 2rem));
  height: var(--home-icon-size, clamp(1.55rem, 5vw, 2rem));
  object-fit: contain;
`;

export default function HomeCommandIcon({ size, alt = '', style, ...props }) {
  return (
    <Icon
      src="/brand/disco-space-cove/emblem-transparent-512.png"
      alt={alt}
      {...props}
      style={{ ...style, ...(size ? { '--home-icon-size': size } : {}) }}
    />
  );
}
