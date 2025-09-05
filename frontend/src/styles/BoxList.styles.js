// src/styles/BoxList.styles.js
import styled, { css, keyframes } from 'styled-components';

/* Toned-down palette with gentle teal/lime cues */
const UI = {
  bg: '#0c0f11',
  panel: '#121518',
  panelAlt: '#171b1f',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.75)',
  line: 'rgba(255,255,255,0.10)',
  teal: '#55c8c3',
  lime: '#9FE070',
  amber: '#E4B26E',
};

const shadowCard = `0 6px 22px rgba(0,0,0,0.28)`;
const radiusXL = '16px';
const radiusL = '12px';

const breatheIn = keyframes`
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const panelBase = css`
  background: ${UI.panel};
  border: 1px solid ${UI.line};
  border-radius: ${radiusXL};
  box-shadow: ${shadowCard};
`;

/* Page */
const Container = styled.div`
  --pad: clamp(12px, 3vw, 20px);
  max-width: 920px;
  margin: 0 auto;
  padding: calc(var(--pad) * 1.4) var(--pad) calc(var(--pad) * 2);
  color: ${UI.text};
  background: ${UI.bg};
`;

/* Page heading */
const Heading = styled.h2`
  font-size: clamp(20px, 4.2vw, 26px);
  font-weight: 900;
  color: ${UI.text};
  margin: 22px 0 14px;
  letter-spacing: 0.2px;
  border-bottom: 2px solid ${UI.line};
  padding-bottom: 8px;
`;

/* Card */
const BoxCard = styled.div`
  ${panelBase};
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: ${radiusXL};
  overflow: hidden;
  cursor: pointer;
  animation: ${breatheIn} 140ms ease both;
  transition: transform 120ms ease, background 160ms ease,
    border-color 160ms ease;

  /* very subtle depth cue on the left */
  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: ${UI.lime};
    opacity: 0.22;
  }

  &:hover {
    transform: translateY(-1px);
    background: ${UI.panelAlt};
  }
`;
const BoxHeader = styled.div`
  display: grid;
  grid-template-columns: auto 1fr; /* shortId then title */
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid ${UI.line};
`;

const BoxTitle = styled.div`
  font-weight: 900;
  font-size: clamp(18px, 3.6vw, 22px);
  color: ${UI.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// NEW: big, obvious short-id badge
const ShortId = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 900;
  font-size: clamp(14px, 3.4vw, 18px);
  letter-spacing: 0.4px;

  color: ${UI.lime};
  background: transparent; /* no fill */
  border: 2px solid ${UI.lime}; /* strong outline */
`;

const Meta = styled.span`
  font-size: 12px;
  color: ${UI.textDim};
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${UI.line};
  align-self: start;
`;

/* Labeled info rows */
const FieldGroup = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
  padding: 10px 16px 0;
  align-items: start;
`;

const FieldLabel = styled.span`
  color: ${UI.textDim};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  line-height: 1.6;
`;

const FieldValue = styled.div`
  color: ${UI.text};
  font-size: 13px;
  line-height: 1.45;
  opacity: 0.95;
  min-height: 1.2em;
  word-break: break-word;
`;

/* Chip rows */
const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 6px;
`;

const TagBubble = styled.span`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.25px;
  user-select: none;

  /* black/near-black background with accent border only */
  background: ${UI.bg};
  color: ${UI.textDim};
  border: 1px solid ${UI.teal};

  /* optional tiny variant (for item name chips) */
  ${({ $tiny }) =>
    $tiny &&
    css`
      height: 20px;
      font-size: 10px;
      font-weight: 700;
      border-color: ${UI.line}; /* even quieter */
    `}
`;
/* Footer pills */
const BoxFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 12px;
  border-top: 1px dashed ${UI.line};
`;

const StatPill = styled.span`
  font-size: 11px;
  font-weight: 900;
  border-radius: 999px;
  padding: 2px 8px;
  line-height: 1.2;
  white-space: nowrap;

  color: ${UI.textDim};
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${UI.line};

  ${({ $variant }) =>
    $variant === 'boxes' &&
    css`
      color: #0b0e10;
      background: ${UI.lime};
      border-color: ${UI.lime};
    `}
  ${({ $variant }) =>
    $variant === 'items' &&
    css`
      color: #0b0e10;
      background: ${UI.amber};
      border-color: ${UI.amber};
    `}
`;

/* Tree indentation */
const NodeChildren = styled.div`
  margin-left: 12px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left: 2px dashed rgba(159, 224, 112, 0.35);
  padding-left: 12px;
`;

const EmptyMessage = styled.div`
  ${panelBase};
  padding: 16px;
  color: ${UI.textDim};
  border-style: dashed;
  background: ${UI.panelAlt};
  text-align: center;
  border-radius: ${radiusL};
`;

export const styledComponents = {
  Container,
  Heading,

  BoxCard,
  BoxHeader,
  BoxTitle,
  Meta,
  ShortId,

  FieldGroup,
  FieldLabel,
  FieldValue,

  TagRow,
  TagBubble,

  BoxFooter,
  StatPill,

  NodeChildren,
  EmptyMessage,
};
