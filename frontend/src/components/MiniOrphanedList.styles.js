import styled, { css } from 'styled-components';

import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../styles/tokens';

const focusRing = css`
  &:focus-visible {
    outline: 2px solid rgba(112, 224, 211, 0.92);
    outline-offset: 2px;
  }
`;

const control = css`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid rgba(126, 147, 158, 0.38);
  border-radius: 4px;
  background: #090d10;
  color: #e3eaed;
  padding: 0 0.62rem;
  font: 500 0.78rem/1.2 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;

  &:hover {
    border-color: rgba(135, 190, 192, 0.58);
  }

  &:focus {
    outline: none;
    border-color: rgba(112, 224, 211, 0.82);
    background: #0d1317;
    box-shadow: inset 0 0 0 1px rgba(112, 224, 211, 0.12);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
    font-size: ${MOBILE_FONT_SM};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const Panel = styled.section`
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(129, 151, 164, 0.32);
  border-radius: 7px;
  background:
    linear-gradient(112deg, rgba(78, 198, 193, 0.055), transparent 30%, rgba(167, 139, 250, 0.035) 100%),
    #0b0f12;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.035);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 5px;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;
  gap: 0.75rem;
  padding: 0.52rem 0.68rem;
  border-bottom: 1px solid rgba(129, 151, 164, 0.25);
  background: rgba(8, 12, 15, 0.86);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 50px;
    padding: 0.44rem 0.5rem;
  }
`;

export const HeadingBlock = styled.div`
  display: grid;
  min-width: 0;
  gap: 0.18rem;
`;

export const Eyebrow = styled.h3`
  margin: 0;
  color: #d9e4e7;
  font: 800 0.7rem/1.15 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const TargetLine = styled.div`
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: 0.42rem;
`;

export const TargetId = styled.span`
  flex: 0 0 auto;
  color: #72d9d0;
  font: 700 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`;

export const TargetLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  color: #b7c3ca;
  font-size: 0.82rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Availability = styled.span`
  flex: 0 0 auto;
  color: #9caab2;
  font: 700 0.68rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const Body = styled.div`
  display: grid;
  min-width: 0;
`;

export const Controls = styled.div`
  display: grid;
  grid-template-columns: minmax(210px, 1.45fr) minmax(130px, 0.7fr) minmax(130px, 0.7fr) minmax(180px, 0.8fr) auto;
  align-items: end;
  gap: 0.46rem;
  padding: 0.52rem;
  border-bottom: 1px solid rgba(129, 151, 164, 0.2);

  @media (max-width: 900px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.38rem;
    padding: 0.42rem;
  }
`;

export const Field = styled.label`
  display: grid;
  min-width: 0;
  gap: 0.22rem;

  ${({ $search }) => $search && css`
    @media (max-width: 900px) {
      grid-column: span 2;
    }
  `}

  ${({ $sort }) => $sort && css`
    @media (max-width: 900px) {
      grid-column: span 2;
    }
  `}
`;

export const ControlLabel = styled.span`
  padding-left: 1px;
  color: rgba(188, 202, 210, 0.7);
  font: 750 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const SearchInput = styled.input`
  ${control};
`;

export const FilterInput = styled.input`
  ${control};
`;

export const CustomSelectShell = styled.div`
  min-width: 0;

  & > div > button {
    min-height: 40px;
    border-color: rgba(126, 147, 158, 0.38);
    border-radius: 4px;
    background: #090d10;
    padding: 0 0.62rem;
    font-size: 0.78rem;
  }

  & > div > div[role='listbox'] {
    gap: 2px;
    margin-top: 3px;
    padding: 3px;
    border-radius: 4px;
    background: rgba(7, 12, 16, 0.995);
  }

  & > div > div[role='listbox'] > button {
    min-height: 40px;
    border-radius: 3px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    & > div > button {
      font-size: ${MOBILE_FONT_SM};
    }
  }
`;

export const SortControl = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  min-width: 0;
  gap: 0.32rem;
`;

export const DirectionButton = styled.button`
  ${focusRing};
  width: 42px;
  min-height: 40px;
  border: 1px solid rgba(126, 147, 158, 0.38);
  border-radius: 4px;
  background: #10161a;
  color: #a9e4df;
  font: 800 1rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease;

  &:hover {
    border-color: rgba(112, 224, 211, 0.72);
    background: #142025;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ResetButton = styled.button`
  ${focusRing};
  min-height: 40px;
  border: 0;
  border-bottom: 1px solid rgba(167, 139, 250, 0.58);
  border-radius: 0;
  background: transparent;
  color: #c8b9ef;
  padding: 0 0.34rem;
  font: 750 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  @media (max-width: 900px) {
    justify-self: start;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
  }
`;

export const ListViewport = styled.div`
  min-width: 0;
  min-height: 0;
  ${({ $maxHeight }) => ($maxHeight ? css`
    max-height: ${$maxHeight};
    overflow-y: auto;
    overscroll-behavior: contain;
  ` : '')}

  &::-webkit-scrollbar {
    width: 7px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background: rgba(111, 142, 150, 0.5);
  }
`;

export const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  min-width: 0;
  gap: 0.58rem;
  padding: 0.48rem 0.54rem;
  border-bottom: 1px solid rgba(129, 151, 164, 0.18);
  background: rgba(11, 15, 18, 0.72);
  transition: background 180ms ease;

  &:hover {
    background: rgba(17, 24, 28, 0.92);
  }

  &:last-child {
    border-bottom: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 0.44rem;
    padding: 0.42rem;
  }
`;

export const ThumbFrame = styled.div`
  width: 46px;
  height: 38px;
  overflow: hidden;
  border: 1px solid rgba(128, 151, 162, 0.32);
  border-radius: 3px;
  background: #070a0c;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 40px;
    height: 36px;
  }
`;

export const ThumbImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const ThumbPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(76, 198, 193, 0.08), rgba(167, 139, 250, 0.06)),
    #0d1215;
`;

export const ItemIdentity = styled.div`
  display: grid;
  min-width: 0;
  gap: 0.22rem;
`;

const itemName = css`
  min-width: 0;
  overflow: hidden;
  color: #e4eaed;
  font-size: 0.82rem;
  font-weight: 670;
  line-height: 1.22;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Name = styled.span`
  ${itemName};
`;

export const NameLink = styled.a`
  ${itemName};
  width: fit-content;
  max-width: 100%;
  text-decoration: none;

  &:hover {
    color: #a9e4df;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  ${focusRing};
`;

export const MetaLine = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.34rem;
  overflow: hidden;
  color: rgba(180, 193, 200, 0.7);
  font: 600 0.62rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const MetaItem = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;

  & + &::before {
    content: '·';
    margin-right: 0.34rem;
    color: rgba(112, 224, 211, 0.48);
  }
`;

export const AssignButton = styled.button`
  ${focusRing};
  min-width: 78px;
  min-height: 40px;
  border: 1px solid rgba(112, 224, 211, 0.5);
  border-radius: 4px;
  background: rgba(19, 37, 40, 0.86);
  color: #d7f2ef;
  padding: 0 0.62rem;
  font: 800 0.64rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease;

  &:hover:not(:disabled) {
    border-color: rgba(112, 224, 211, 0.9);
    background: rgba(27, 55, 58, 0.96);
    color: #f2fffd;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 68px;
    min-height: 40px;
    padding: 0 0.4rem;
    font-size: ${MOBILE_FONT_XS};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StateText = styled.div`
  margin: 0.48rem;
  border-left: 2px solid ${({ $error }) => ($error ? '#dc7f88' : 'rgba(112, 224, 211, 0.52)')};
  color: ${({ $error }) => ($error ? '#f0b7bc' : '#aab7bd')};
  padding: 0.34rem 0.48rem;
  font-size: 0.74rem;
`;

export const PaginationRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.4rem;
  padding: 0.44rem 0.52rem;
  border-top: 1px solid rgba(129, 151, 164, 0.2);
  background: #090d10;
`;

export const PaginationButton = styled.button`
  ${focusRing};
  min-height: 40px;
  border: 1px solid rgba(126, 147, 158, 0.38);
  border-radius: 4px;
  background: #11171b;
  color: #d8e3e6;
  padding: 0 0.65rem;
  font: 750 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.42;
  }
`;

export const PaginationInfo = styled.span`
  color: #8e9ca4;
  font: 650 0.64rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-align: center;
`;

export const LoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.44rem;
  border-top: 1px solid rgba(129, 151, 164, 0.2);
`;

export const LoadMoreButton = styled(PaginationButton)`
  min-width: 120px;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`;
