import styled, { css } from 'styled-components';
import { inputStyles, controlStyles } from '../styles/primitives';

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
  ${inputStyles}
  width: 100%;
`;

export const Panel = styled.section`
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(129, 151, 164, 0.32);
  border-radius: 7px;
  background: var(--dw-surface);
  box-shadow: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 5px;
  }
  min-width: 0;
  font-family: var(--dw-font-ui);
  & :is(button, a, input, select, textarea):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
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
  background: var(--dw-surface);

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
  font: 800 0.7rem/1.15 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
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
  font: 700 0.75rem/1 var(--dw-font-ui);
  font-family: var(--dw-font-data);
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
  font: 700 0.75rem/1.2 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
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
  font: 750 0.75rem/1 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;

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
    background: var(--dw-background);
    padding: 0 0.62rem;
    font-size: 0.78rem;
  }

  & > div > div[role='listbox'] {
    gap: 2px;
    margin-top: 3px;
    padding: 3px;
    border-radius: 4px;
    background: var(--dw-surface);
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
  background: var(--dw-surface);
  color: #a9e4df;
  font: 800 1rem/1 var(--dw-font-ui);
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease;

  &:hover {
    border-color: rgba(112, 224, 211, 0.72);
    background: var(--dw-surface);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ResetButton = styled.button`
  ${controlStyles}
  ${focusRing};
  min-height: 40px;
  border: 0;
  border-bottom: 1px solid rgba(167, 139, 250, 0.58);
  border-radius: 0;
  background: transparent;
  color: #c8b9ef;
  padding: 0 0.34rem;
  font: 750 0.75rem/1 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;

  @media (max-width: 900px) {
    justify-self: start;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
  }
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  justify-self: start;
  padding-inline: 0.65rem;
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
  background: var(--dw-surface);
  transition: background 180ms ease;

  &:hover {
    background: var(--dw-surface-raised);
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
  background: var(--dw-background);

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
  background: var(--dw-surface);
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
  font: 600 0.75rem/1.2 var(--dw-font-ui);
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
  background: var(--dw-surface-raised);
  color: #d7f2ef;
  padding: 0 0.62rem;
  font: 800 0.75rem/1 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease;

  &:hover:not(:disabled) {
    border-color: rgba(112, 224, 211, 0.9);
    background: var(--dw-surface-raised);
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
  font-size: 0.75rem;
`;

export const PaginationRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.4rem;
  padding: 0.44rem 0.52rem;
  border-top: 1px solid rgba(129, 151, 164, 0.2);
  background: var(--dw-background);
`;

export const PaginationButton = styled.button`
  ${focusRing};
  min-height: 40px;
  border: 1px solid rgba(126, 147, 158, 0.38);
  border-radius: 4px;
  background: var(--dw-surface);
  color: #d8e3e6;
  padding: 0 0.65rem;
  font: 750 0.75rem/1 var(--dw-font-ui);
  text-transform: none;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.42;
  }
`;

export const PaginationInfo = styled.span`
  color: #8e9ca4;
  font: 650 0.75rem/1.2 var(--dw-font-ui);
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
