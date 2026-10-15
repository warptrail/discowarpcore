import styled from 'styled-components';

const Icon = styled.svg`
  width: 16px; height: 16px; flex: 0 0 auto; vertical-align: middle;
  fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round;
`;
const paths = {
  move: 'M3 7h12v12H3V7Zm3-3h12v8m-4 3h8m-3-3 3 3-3 3',
  eject: 'm12 4 7 10H5l7-10ZM5 19h14',
  image: 'M3 4h18v16H3V4Zm0 13 6-6 4 4 3-3 5 5M16 8h.01',
  all: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  hierarchy: 'M9 3h6v5H9V3ZM4 16h5v5H4v-5Zm11 0h5v5h-5v-5ZM12 8v4M6 16v-4h12v4',
  used: 'm8 5 11 7-11 7V5Z',
  checked: 'm5 12 4 4L19 6',
  maintained: 'M14 5a5 5 0 0 0-6 6L3 16l5 5 5-5a5 5 0 0 0 6-6l-4 3-4-4 3-4Z',
  consumed: 'M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z',
};
export default function ItemCommandIcon({ action }) {
  return <Icon viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={paths[action]} /></Icon>;
}
