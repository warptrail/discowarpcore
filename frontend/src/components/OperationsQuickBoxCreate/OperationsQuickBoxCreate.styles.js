import styled, { css } from 'styled-components';
import { inputStyles, controlStyles } from '../../styles/primitives';
import * as L from '../BoxForms/BoxEditForm.styles';

const uiFont = 'var(--dw-font-ui)';

export const Shell = styled.section`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  min-width: 0;
  margin: 0 auto;
  border: 1px solid var(--dw-border);
  border-left: 4px solid var(--dw-amber);
  border-radius: var(--dw-radius);
  padding: .75rem;
  background: var(--dw-surface);
  box-shadow: none;
  min-width: 0;
  font-family: var(--dw-font-ui);
  & :is(button, a, input, select, textarea):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
  margin: -.12rem -.12rem .58rem;
  border-bottom: 1px solid rgba(127,215,255,.18);
  padding: .08rem .12rem .55rem;
`;

export const Eyebrow = styled.span`
  display: block;
  color: var(--dw-violet);
  font: 800 0.75rem/1 ${uiFont};
  letter-spacing: normal;
  text-transform: none;
`;

export const Title = styled.h3`
  display: flex;
  align-items: center;
  gap: .5rem;
  margin: .18rem 0 0;
  color: var(--dw-text);
  font-size: clamp(1.08rem, 4vw, 1.35rem);
  line-height: 1.1;
`;

export const TitleIcon = styled.span`
  color: var(--dw-violet);
  font: 1.55rem/0.8 ${uiFont};
  text-shadow: none;
`;

export const Close = styled.button`
  width: 44px;
  height: 44px;
  margin: -.28rem -.12rem 0 0;
  border: 0;
  color: rgba(230,237,243,.68);
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;

  &:hover, &:focus-visible { color: #fff; outline: 1px solid rgba(127,215,255,.55); }
`;

export const Form = styled.form`
  display: grid;
  gap: .55rem;
`;

export const IdentityRow = styled.div`
  display: grid;
  grid-template-columns: 5.4rem minmax(0,1fr);
  gap: .48rem;

  @media(max-width:430px){ grid-template-columns: 5.4rem minmax(0,1fr); }
`;

export const Field = styled.label`
  display: grid;
  gap: .22rem;
  min-width: 0;
`;

export const Label = styled.span`
  color: rgba(127,215,255,.78);
  font: 800 0.75rem/1 ${uiFont};
  letter-spacing: normal;
  text-transform: none;
`;

const field = css`
  ${inputStyles}
  box-sizing: border-box;
  width: 100%;
`;

export const Input = styled.input`${field}
`;
export const CodeInput = styled(Input)`
  padding-inline: .35rem;
  text-align: center;
  font-family: ${uiFont};
  font-size: 1.05rem;
  letter-spacing: normal;
`;
export const Textarea = styled.textarea`
  ${field}
  min-height: 58px;
  resize: vertical;
`;

export const Availability = styled.span`
  min-height: .75rem;
  color: ${({ $bad, $good }) => $bad ? '#ffaaa7' : $good ? '#9be2b5' : 'rgba(230,237,243,.5)'};
  font: 700 0.75rem/1.2 ${uiFont};
`;

export const LocationPanel = styled.div`
  ${L.LocationSubform} {
    border-color: rgba(54,181,249,.55);
    border-left: 3px solid #39bbf4;
    border-radius: var(--dw-radius);
    background: var(--dw-surface);
  }
  ${L.LocationSubformTitle} {
    color: #9bc9ff;
    font: 800 0.75rem ${uiFont};
    letter-spacing: normal;
  }
  ${L.LocationStructureGrid} { margin-top: 1px; gap: 7px; }
  ${L.LocationLevelField} { color: #97aede; }
  ${L.LocationInput} {
    border-color: rgba(80,146,229,.52);
    border-radius: 6px;
    background: var(--dw-surface);
  }
  ${L.LocationInput}:focus { border-color: #61cfff; }
`;

export const PhotoField = styled.div`
  display: grid;
  grid-template-columns: 54px minmax(0,1fr) auto;
  align-items: center;
  gap: .58rem;
  min-height: 58px;
  border: 1px solid rgba(65,186,232,.43);
  border-left: 3px solid #3dc9ea;
  border-radius: 9px;
  padding: .4rem .5rem;
  background: var(--dw-surface-raised);

  @media(max-width:430px) {
    grid-template-columns: 48px minmax(0,1fr);
  }
`;

export const PhotoPreview = styled.div`
  width: 54px;
  height: 54px;
  border: 1px solid rgba(127,215,255,.42);
  border-radius: 5px;
  background: ${({ $src }) => $src ? `center / cover no-repeat url("${$src}")` : 'rgba(3,9,15,.78)'};
  display: grid;
  place-items: center;
  color: #65d8f3;
  font: 800 1.25rem ${uiFont};

  @media(max-width:430px) {
    width: 48px;
    height: 48px;
  }
`;

export const PhotoCopy = styled.span`
  min-width: 0;
  color: var(--dw-text);
  font-size: .76rem;
  line-height: 1.2;
  strong, small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  small { margin-top:.15rem; color:rgba(230,237,243,.52); font-size: 0.75rem; }
`;

export const PhotoPickerSlot = styled.div`
  min-width: 0;

  @media(max-width:430px) {
    grid-column: 1 / -1;
  }
`;

export const PhotoAction = styled.button`
  min-height: 44px;
  border: 1px solid rgba(232,177,92,.45);
  border-radius: 5px;
  padding: .42rem .56rem;
  color: var(--dw-amber);
  background: rgba(232,177,92,.05);
  font: 800 0.75rem ${uiFont};
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;

  &:hover:not(:disabled), &:focus-visible {
    border-color: var(--dw-amber);
    outline: none;
    box-shadow: none;
  }

  &:disabled { opacity: .42; cursor: not-allowed; }

  @media(max-width:430px) { width: 100%; }
`;

export const Details = styled.details`
  border: 1px solid rgba(137,100,244,.45);
  border-left: 4px solid var(--dw-amber);
  border-radius: 8px;
  padding: 0 .55rem .25rem;
  background: var(--dw-surface-raised);

  &[open] > summary { margin-bottom: .52rem; }
`;

export const Summary = styled.summary`
  min-height: var(--dw-control-height);
  display: flex;
  align-items: center;
  color: #af8dfd;
  font: 800 0.75rem ${uiFont};
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: .52rem;
  @media(max-width:560px){ grid-template-columns:1fr; }
`;

export const StagingField = styled.div`
  display: grid;
  grid-column: 1 / -1;
  gap: .3rem;
`;

export const StagingOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .3rem;

  @media(max-width:560px){
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StagingOption = styled.button`
  display: grid;
  grid-template-columns: 5px minmax(0, 1fr);
  align-items: center;
  gap: .38rem;
  min-width: 0;
  min-height: 42px;
  border: 1px solid ${({ $active, $tone }) =>
    $active ? $tone : 'rgba(112,157,187,.28)'};
  border-radius: 6px;
  padding: .34rem .42rem;
  color: ${({ $active }) => $active ? '#eef6fa' : 'rgba(230,237,243,.62)'};
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'rgba(5,11,17,.5)'};
  text-align: left;
  cursor: pointer;

  > span:last-child {
    display: grid;
    gap: .08rem;
    min-width: 0;
  }

  strong {
    overflow: hidden;
    font: 800 0.75rem/1.1 ${uiFont};
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    overflow: hidden;
    color: rgba(184,202,212,.48);
    font: 600 0.75rem/1.1 ${uiFont};
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:focus-visible {
    outline: 2px solid rgba(127,215,255,.68);
    outline-offset: 2px;
  }
`;

export const StagingLight = styled.span`
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: ${({ $active, $tone }) => $active ? $tone : 'rgba(154,171,187,.2)'};
  box-shadow: none;
`;

export const TagInput = styled(Input)`font-size:.8rem;
`;

export const Footer = styled.footer`
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  align-items: center;
  gap: .42rem;
  padding-top: .18rem;
`;

export const Button = styled.button`
  ${controlStyles}
  min-height: 42px;
  border: 1px solid ${({ $primary }) => $primary ? 'rgba(39,231,180,.84)' : 'rgba(65,198,233,.6)'};
  border-radius: 6px;
  padding: .45rem .72rem;
  color: var(--dw-text);
  background: ${({ $primary }) => $primary ? 'var(--dw-surface-raised)' : 'rgba(6,22,35,.7)'};
  font: 800 0.75rem ${uiFont};
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
  &:disabled { opacity:.42; cursor:not-allowed; }
  &:hover:not(:disabled), &:focus-visible { border-color:#57e5d1; box-shadow: none; }
`;

export const Message = styled.p`
  margin: 0;
  border-left: 2px solid ${({ $error }) => $error ? '#f07872' : '#9be2b5'};
  padding: .4rem .52rem;
  color: ${({ $error }) => $error ? '#ffc5c2' : '#c9f8d9'};
  background: var(--dw-surface-raised);
  font-size: 0.75rem;
  line-height: 1.35;
`;
