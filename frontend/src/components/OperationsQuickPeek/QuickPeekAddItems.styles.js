import styled from 'styled-components';
import { controlStyles } from '../../styles/primitives';

export const Overlay = styled.div`
  position: absolute; inset: 0; z-index: 250; min-height: 0;
  bottom: ${({ $expanded }) => $expanded ? '0' : 'var(--quick-peek-collapsed-shift, 0px)'};
  display: flex; align-items: flex-end; justify-content: center; padding: 8px;
  background: rgba(5, 10, 16, .6); border-radius: inherit;
  @media (min-width: 768px) { bottom: 0; }
`;
export const Dialog = styled.section`
  display: flex; flex-direction: column; min-width: 0; max-height: 100%; width: 100%;
  border: 1px solid var(--dw-border); border-radius: 4px;
  background: var(--dw-surface); color: var(--dw-text);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, .3);
`;
export const Header = styled.div`
  display: flex; align-items: center; gap: 6px; padding: 2px;
  border-bottom: 1px solid var(--dw-border); flex: 0 0 auto;
`;
export const Identity = styled.div`
  flex: 1; min-width: 0; padding: 6px; font: 600 .8rem/1.3 var(--dw-font-ui);
  code { color: var(--box-primary, var(--dw-cyan)); margin-right: 6px; }
  small { display: block; color: var(--dw-text-secondary); font-weight: 400; overflow-wrap: anywhere; }
`;
export const Body = styled.div`
  display: grid; gap: 8px; padding: ${({ $menu }) => $menu ? '2px' : '8px'}; min-height: 0; overflow: auto;
  overscroll-behavior: contain; scrollbar-width: thin;
`;
export const ChoiceRail = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); min-width: 0;
  background: var(--dw-surface-raised); border-radius: 2px;
  box-shadow: inset 0 1px 0 rgba(230, 237, 243, .04);
`;
export const Choice = styled.button`
  ${controlStyles}
  position: relative; display: flex; align-items: center; justify-content: center;
  min-height: 48px; min-width: 0; width: 100%; padding: 8px 10px;
  border: 0; border-radius: 2px; background: transparent;
  color: var(--dw-text-secondary); gap: 8px; font-size: .8rem; font-weight: 500;
  svg { flex: 0 0 auto; width: 20px; height: 20px; fill: none; stroke: var(--dw-cyan); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  & + &::before { content: ''; position: absolute; left: 0; top: 12px; bottom: 12px; width: 1px; background: var(--dw-border); pointer-events: none; }
  &:hover:not(:disabled), &:focus-visible { color: var(--dw-text); background: rgba(113, 210, 255, .08); }
  &:focus-visible { outline-offset: -2px; }
  &:active:not(:disabled) { background: rgba(113, 210, 255, .14); }
`;
