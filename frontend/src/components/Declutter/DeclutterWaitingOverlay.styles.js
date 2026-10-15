import styled from 'styled-components';
import * as S from './Declutter.styles';

export const Backdrop = styled(S.QueueOverlay)`
  place-items:center; padding:24px; background:rgba(3,6,10,.56); backdrop-filter:blur(4px);
  @media(max-width:540px) { padding:16px; }
`;
export const Dialog = styled(S.QueuePopover)`
  display:grid; grid-template-rows:auto minmax(0,1fr); max-height:min(70dvh,560px); overflow:hidden;
  border-color:var(--declutter-accent,var(--dw-cyan)); border-radius:16px;
  background:var(--dw-background); box-shadow:0 0 24px rgba(var(--declutter-accent-rgb,127,215,255),.12),inset 0 1px 0 rgba(255,255,255,.09);
  ${S.QueuePopoverHeader} { align-items:center; padding:12px 16px; border-color:var(--dw-border-soft); }
  ${S.QueuePopoverTitle} { font-size:1.3rem; letter-spacing:-.02em; }
  ${S.IconButton} { width:44px; height:44px; border:0; background:transparent; }
  ${S.QueueLinkList} { overflow-y:auto; min-height:0; overscroll-behavior:contain; }
  ${S.QueueLink} { padding:12px 16px; min-height:60px; strong { font-size:.85rem; } }
`;
