import styled from 'styled-components';
import { splitSearchHighlights } from '../util/searchHighlight';

const Match = styled.mark`
  color: #c4f6ff;
  background: rgba(113, 210, 255, .2);
  border-radius: 2px;
  box-shadow: inset 0 -1px 0 rgba(113, 210, 255, .65);
  font: inherit;
  text-shadow: none;
`;

export default function SearchHighlight({ text, terms }) {
  return splitSearchHighlights(text, terms).map((part, index) => part.match
    ? <Match key={index}>{part.text}</Match> : part.text);
}
