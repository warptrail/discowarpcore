import styled from 'styled-components';
import houseCommandIcon from '../assets/house-command-icon.webp';

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
      src={houseCommandIcon}
      alt={alt}
      {...props}
      style={{ ...style, ...(size ? { '--home-icon-size': size } : {}) }}
    />
  );
}
