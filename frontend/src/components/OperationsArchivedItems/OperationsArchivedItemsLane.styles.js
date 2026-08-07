import styled from 'styled-components';
import { Link } from 'react-router-dom';

const coral = '#F08A7B';
const lilac = '#A7B6FF';
const cyan = '#67D9D3';

export const Lane = styled.section`
  position: relative;
  display: grid;
  gap: 0;
  min-width: 0;
  margin-top: 0.44rem;
  padding: 0 0.7rem 0.65rem 0.9rem;
  overflow: hidden;
  border: 1px solid rgba(240, 138, 123, 0.58);
  border-radius: 22px 8px 10px 16px;
  background:
    radial-gradient(circle at 92% 0%, rgba(167, 182, 255, 0.14), transparent 34%),
    linear-gradient(100deg, rgba(240, 138, 123, 0.09), transparent 24%),
    rgba(7, 14, 20, 0.94);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
`;

export const SignalRail = styled.span`
  position: absolute;
  inset: 0 auto 0 0;
  width: 7px;
  background: linear-gradient(180deg, ${coral}, #E8B15C 38%, ${lilac} 72%, ${cyan});
  box-shadow: 0 0 18px rgba(240, 138, 123, 0.3);
`;

export const Header = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: end;
  padding: 0.72rem 0 0.62rem;
  border-bottom: 1px solid rgba(240, 138, 123, 0.28);
`;

export const Kicker = styled.div`
  color: ${coral};
  font: 850 0.58rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.14em;
`;

export const Title = styled.h2`
  margin: 0.18rem 0 0;
  color: #f4e6e5;
  font-size: clamp(1rem, 3vw, 1.22rem);
  line-height: 1.1;
`;

export const Subtitle = styled.p`
  margin: 0.18rem 0 0;
  color: rgba(230, 237, 243, 0.64);
  font-size: 0.68rem;
`;

export const Count = styled.div`
  display: grid;
  justify-items: end;
  color: ${lilac};
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase;

  strong { font-size: 1.7rem; line-height: 0.9; }
  span { margin-top: 0.2rem; font-size: 0.52rem; letter-spacing: 0.08em; }
`;

export const ItemList = styled.div`
  display: grid;
  max-height: min(58dvh, 540px);
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const ItemLink = styled(Link)`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 0.58rem;
  align-items: center;
  min-height: 48px;
  padding: 0.34rem 0.12rem;
  border-bottom: 1px solid rgba(103, 217, 211, 0.15);
  color: inherit;
  text-decoration: none;

  &:hover, &:focus-visible {
    background: linear-gradient(90deg, rgba(240, 138, 123, 0.12), transparent 76%);
    outline: none;
  }
`;

export const Thumbnail = styled.span`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  overflow: hidden;
  border: 1px solid rgba(240, 138, 123, 0.42);
  border-radius: 5px;
  color: rgba(167, 182, 255, 0.6);
  background: rgba(3, 9, 14, 0.8);

  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const ItemCopy = styled.span`
  display: grid;
  min-width: 0;
`;

export const ItemName = styled.strong`
  overflow: hidden;
  color: rgba(238, 243, 248, 0.92);
  font-size: 0.78rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemMeta = styled.span`
  display: flex;
  gap: 0.24rem 0.55rem;
  min-width: 0;
  margin-top: 0.13rem;
  color: rgba(167, 182, 255, 0.66);
  font-size: 0.58rem;

  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span:last-child { color: rgba(230, 237, 243, 0.48); }
`;

export const Quantity = styled.span`
  color: ${coral};
  font: 800 0.65rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
`;

export const Message = styled.p`
  margin: 0;
  padding: 1.1rem 0.2rem;
  color: ${({ $error }) => ($error ? '#ffb2a7' : 'rgba(230, 237, 243, 0.62)')};
  font-size: 0.75rem;
`;

export const AllItemsLink = styled(Link)`
  justify-self: end;
  margin-top: 0.55rem;
  color: ${coral};
  font: 800 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;

  &:hover, &:focus-visible { color: #ffd0c9; outline: none; }
`;
