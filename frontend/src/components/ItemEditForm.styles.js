import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../styles/tokens';

export const FormContainer = styled.div`
  background-color: #1e1e1e;
  color: #eee;
  padding: 1rem;
  border-radius: 0px 0px 10px 10px;
  border: 1px solid #333;
  border-top: none;
  min-width: 0;
  max-width: 100%;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.62rem;
    border-radius: 0 0 ${MOBILE_PANEL_RADIUS} ${MOBILE_PANEL_RADIUS};
  }
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0.42rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const FieldHint = styled.div`
  margin-top: 0.3rem;
  color: rgba(234, 234, 234, 0.66);
  font-size: 0.74rem;
  line-height: 1.35;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const Input = styled.input`
  width: 100%;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0.72rem;
    padding: 0.42rem;
    min-height: 36px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const LinkInput = styled(Input)`
  margin-bottom: 0;
`;

export const TextArea = styled.textarea`
  width: 100%;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  min-height: 80px;
  resize: vertical;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0.72rem;
    padding: 0.42rem;
    min-height: 74px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Select = styled.select`
  width: 100%;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0.72rem;
    padding: 0.42rem;
    min-height: 36px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const SectionTitle = styled.h4`
  margin: 1rem 0 0.5rem;
  font-size: 0.92rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b7d4d1;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin: 0.72rem 0 0.4rem;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.04em;
  }
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.42rem;
  }
`;

export const StaticValue = styled.div`
  width: 100%;
  background-color: #252a33;
  color: #f1f4f8;
  border: 1px solid #425067;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  display: flex;
  align-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0.72rem;
    padding: 0.42rem;
    min-height: 36px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const HistoryFieldWrap = styled.div`
  margin-bottom: 0.75rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0.56rem;
  }
`;

export const DateHistoryRows = styled.div`
  display: grid;
  gap: 0.42rem;
`;

export const DateHistoryRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }
`;

export const LinksWrap = styled.div`
  display: grid;
  gap: 0.55rem;
  margin-bottom: 0.85rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.42rem;
    margin-bottom: 0.62rem;
  }
`;

export const LinkRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.2fr) auto;
  gap: 0.45rem;
  align-items: end;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }
`;

const linkButtonBase = `
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 6px;
  cursor: pointer;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 36px;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const LinkRemoveButton = styled.button`
  ${linkButtonBase}
  border: 1px solid rgba(242, 132, 132, 0.55);
  background: rgba(88, 34, 34, 0.82);
  color: #ffd5d5;
  padding: 0.45rem 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 650;

  &:hover {
    border-color: rgba(242, 132, 132, 0.82);
    background: rgba(110, 40, 40, 0.88);
  }
`;

export const LinkAddButton = styled.button`
  ${linkButtonBase}
  justify-self: start;
  border: 1px solid rgba(111, 201, 188, 0.62);
  background: rgba(26, 76, 69, 0.72);
  color: #d5fff8;
  padding: 0.45rem 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;

  &:hover {
    border-color: rgba(111, 201, 188, 0.85);
    background: rgba(32, 95, 85, 0.82);
  }
`;

export const DateHistoryAddButton = styled(LinkAddButton)`
  margin-top: 0.36rem;
`;

export const DateHistoryRemoveButton = styled(LinkRemoveButton)`
  margin: 0;
`;

export const CheckboxRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0.72rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Checkbox = styled.input`
  width: auto;
  margin: 0;
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.42rem;
    flex-wrap: wrap;
  }
`;

export const Button = styled.button`
  background-color: ${(props) =>
    props.$variant === 'close' ? '#555' : '#009688'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border: 1px solid red;
  }

  &:hover {
    background-color: ${(props) =>
      props.$variant === 'close' ? '#666' : '#00796b'};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1;
    min-width: 0;
    min-height: 36px;
    padding: 0.42rem 0.62rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const SaveFlash = styled.span`
  color: limegreen;
  font-weight: bold;
  margin-left: 8px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-left: 0;
    font-size: ${MOBILE_FONT_SM};
  }
`;
