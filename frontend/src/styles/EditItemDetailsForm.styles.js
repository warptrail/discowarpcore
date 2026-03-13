import styled from 'styled-components';

const LCARS = {
  panel: '#11161f',
  panelSoft: '#171e2a',
  inset: '#0b1018',
  line: 'rgba(130, 168, 196, 0.36)',
  text: '#e6edf4',
  textDim: 'rgba(214, 226, 241, 0.8)',
  teal: '#4cc6c1',
  coral: '#f08a7b',
  amber: '#e8b15c',
  lilac: '#a7b6ff',
};

const disabledStyles = `
  opacity: 0.52;
  cursor: not-allowed;
`;

export const Form = styled.form`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid ${LCARS.line};
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 34%),
    ${LCARS.panel};
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 14px 28px rgba(0, 0, 0, 0.24);
  overflow: hidden;
  isolation: isolate;

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  &::before {
    left: 0.9rem;
    right: 0.9rem;
    top: 0.65rem;
    height: 5px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${LCARS.coral} 0 17%,
      transparent 17% 21%,
      ${LCARS.teal} 21% 56%,
      transparent 56% 62%,
      ${LCARS.amber} 62% 82%,
      transparent 82% 86%,
      ${LCARS.lilac} 86% 100%
    );
    opacity: 0.62;
  }

  &::after {
    left: 0;
    top: 1.15rem;
    bottom: 1.15rem;
    width: 8px;
    border-radius: 0 999px 999px 0;
    background: linear-gradient(180deg, ${LCARS.teal}, ${LCARS.lilac} 58%, ${LCARS.coral});
    opacity: 0.48;
  }

  @media (max-width: 640px) {
    padding: 0.85rem 0.75rem 0.8rem;
  }
`;

export const Fieldset = styled.fieldset`
  position: relative;
  z-index: 1;
  border: 0;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;

  &:disabled {
    opacity: 0.66;
    pointer-events: none;
  }
`;

export const Field = styled.div`
  display: grid;
  gap: 0.4rem;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(140, 160, 179, 0.2);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 70%),
    ${LCARS.panelSoft};

  @media (max-width: 640px) {
    padding: 0.5rem 0.52rem;
  }
`;

export const Label = styled.label`
  font-size: 0.74rem;
  font-weight: 700;
  color: ${LCARS.textDim};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const fieldControlStyles = `
  width: 100%;
  border-radius: 9px;
  border: 1px solid rgba(122, 142, 167, 0.45);
  background: ${LCARS.inset};
  color: ${LCARS.text};
  font-size: 1.02rem;
  font-weight: 520;
  line-height: 1.35;
  padding: 0.62rem 0.72rem;
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;

  &::placeholder {
    color: rgba(214, 226, 241, 0.44);
  }

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow:
      0 0 0 2px rgba(76, 198, 193, 0.25),
      inset 0 0 0 1px rgba(255, 255, 255, 0.03);
    background: #0c121b;
  }
`;

export const Input = styled.input`
  ${fieldControlStyles}
`;

export const TextArea = styled.textarea`
  ${fieldControlStyles}
  min-height: 4.6rem;
  resize: vertical;
`;

export const Select = styled.select`
  ${fieldControlStyles}
`;

export const InlineGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const CheckboxRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: ${LCARS.text};
  cursor: pointer;
`;

export const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: ${LCARS.teal};
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 0.35rem;

  @media (max-width: 640px) {
    justify-content: stretch;
  }
`;

const actionButtonBase = `
  min-width: 6.2rem;
  border-radius: 999px;
  padding: 0.52rem 1.05rem;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;

  &:active:enabled {
    transform: translateY(1px);
  }

  &:disabled {
    ${disabledStyles}
  }
`;

export const SaveButton = styled.button`
  ${actionButtonBase}
  border: 1px solid #2f8f4d;
  color: #d6ffe4;
  background: linear-gradient(180deg, #2d8f47, #216b36);
  box-shadow: 0 0 0 1px rgba(17, 30, 20, 0.42);

  &:hover:enabled {
    border-color: #42b765;
    background: linear-gradient(180deg, #35a353, #257840);
    box-shadow:
      0 0 0 1px rgba(21, 35, 26, 0.45),
      0 0 16px rgba(51, 163, 83, 0.28);
  }

  @media (max-width: 640px) {
    flex: 1;
    min-width: 0;
  }
`;

export const RevertButton = styled.button`
  ${actionButtonBase}
  border: 1px solid rgba(167, 182, 255, 0.58);
  color: #d7defd;
  background: linear-gradient(180deg, #2b3552, #20293f);

  &:hover:enabled {
    border-color: rgba(167, 182, 255, 0.82);
    background: linear-gradient(180deg, #344064, #27314e);
    box-shadow: 0 0 14px rgba(167, 182, 255, 0.22);
  }

  @media (max-width: 640px) {
    flex: 1;
    min-width: 0;
  }
`;
