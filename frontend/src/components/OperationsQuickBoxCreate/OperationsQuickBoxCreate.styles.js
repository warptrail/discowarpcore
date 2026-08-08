import styled from 'styled-components';

const mono = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";

export const Shell = styled.section`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  min-width: 0;
  margin: 0 auto;
  border: 1px solid rgba(112,157,187,.38);
  border-radius: 8px;
  padding: .68rem;
  background: rgba(7,12,18,.96);
  box-shadow: inset 0 1px rgba(255,255,255,.025), 0 12px 32px rgba(0,0,0,.24);
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
  color: rgba(127,215,255,.7);
  font: 800 .56rem/1 ${mono};
  letter-spacing: .14em;
  text-transform: uppercase;
`;

export const Title = styled.h3`
  margin: .18rem 0 0;
  color: #edf5fb;
  font-size: clamp(1rem, 4vw, 1.18rem);
  line-height: 1.1;
`;

export const Close = styled.button`
  width: 40px;
  height: 40px;
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
  gap: .58rem;
`;

export const IdentityRow = styled.div`
  display: grid;
  grid-template-columns: 5.4rem minmax(0,1fr);
  gap: .48rem;

  @media(max-width:430px){ grid-template-columns:1fr; }
`;

export const Field = styled.label`
  display: grid;
  gap: .22rem;
  min-width: 0;
`;

export const Label = styled.span`
  color: rgba(127,215,255,.78);
  font: 800 .56rem/1 ${mono};
  letter-spacing: .11em;
  text-transform: uppercase;
`;

const field = `
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 42px;
  border: 1px solid rgba(112,157,187,.48);
  border-radius: 6px;
  padding: .54rem .62rem;
  color: #e6edf3;
  background: rgba(5,11,17,.9);
  outline: none;
  &:focus { border-color: #7fd7ff; box-shadow: 0 0 0 2px rgba(127,215,255,.2); }
`;

export const Input = styled.input`${field}`;
export const CodeInput = styled(Input)`
  padding-inline: .35rem;
  text-align: center;
  font-family: ${mono};
  font-size: 1.05rem;
  letter-spacing: .16em;
`;
export const Textarea = styled.textarea`
  ${field}
  min-height: 58px;
  resize: vertical;
`;

export const Availability = styled.span`
  min-height: .75rem;
  color: ${({ $bad, $good }) => $bad ? '#ffaaa7' : $good ? '#9be2b5' : 'rgba(230,237,243,.5)'};
  font: 700 .54rem/1.2 ${mono};
`;

export const PhotoField = styled.div`
  display: grid;
  grid-template-columns: 54px minmax(0,1fr) auto;
  align-items: center;
  gap: .58rem;
  min-height: 58px;
  border-block: 1px solid rgba(127,215,255,.2);
  padding: .38rem 0;

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
  color: rgba(127,215,255,.48);
  font: 800 .52rem ${mono};

  @media(max-width:430px) {
    width: 48px;
    height: 48px;
  }
`;

export const PhotoCopy = styled.span`
  min-width: 0;
  color: #e6edf3;
  font-size: .76rem;
  line-height: 1.2;
  strong, small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  small { margin-top:.15rem; color:rgba(230,237,243,.52); font-size:.62rem; }
`;

export const PhotoPickerSlot = styled.div`
  min-width: 0;

  @media(max-width:430px) {
    grid-column: 1 / -1;
  }
`;

export const PhotoAction = styled.button`
  min-height: 40px;
  border: 1px solid rgba(232,177,92,.45);
  border-radius: 5px;
  padding: .42rem .56rem;
  color: #e8b15c;
  background: rgba(232,177,92,.05);
  font: 800 .58rem ${mono};
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover:not(:disabled), &:focus-visible {
    border-color: #e8b15c;
    outline: none;
    box-shadow: 0 0 12px rgba(232,177,92,.14);
  }

  &:disabled { opacity: .42; cursor: not-allowed; }

  @media(max-width:430px) { width: 100%; }
`;

export const Details = styled.details`
  border-top: 1px solid rgba(127,215,255,.18);
  padding-top: .34rem;

  &[open] > summary { margin-bottom: .52rem; }
`;

export const Summary = styled.summary`
  min-height: 36px;
  display: flex;
  align-items: center;
  color: rgba(127,215,255,.72);
  font: 800 .6rem ${mono};
  letter-spacing: .09em;
  text-transform: uppercase;
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
  background: ${({ $active, $tone }) =>
    $active
      ? `linear-gradient(100deg, ${$tone}22, rgba(5,11,17,.82))`
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
    font: 800 .63rem/1.1 ${mono};
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    overflow: hidden;
    color: rgba(184,202,212,.48);
    font: 600 .52rem/1.1 ${mono};
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
  box-shadow: ${({ $active, $tone }) => $active ? `0 0 8px ${$tone}88` : 'none'};
`;

export const TagInput = styled(Input)`font-size:.8rem;`;

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .42rem;
  padding-top: .18rem;
`;

export const Button = styled.button`
  min-height: 42px;
  border: 1px solid ${({ $primary }) => $primary ? 'rgba(232,177,92,.72)' : 'rgba(127,215,255,.28)'};
  border-radius: 6px;
  padding: .45rem .72rem;
  color: ${({ $primary }) => $primary ? '#ffe0a4' : 'rgba(230,237,243,.72)'};
  background: ${({ $primary }) => $primary ? 'linear-gradient(90deg,rgba(95,59,15,.9),rgba(34,29,21,.95))' : 'transparent'};
  font: 800 .65rem ${mono};
  letter-spacing: .07em;
  text-transform: uppercase;
  cursor: pointer;
  &:disabled { opacity:.42; cursor:not-allowed; }
  &:hover:not(:disabled), &:focus-visible { border-color:#e8b15c; box-shadow:0 0 14px rgba(232,177,92,.18); }
`;

export const Message = styled.p`
  margin: 0;
  border-left: 2px solid ${({ $error }) => $error ? '#f07872' : '#9be2b5'};
  padding: .4rem .52rem;
  color: ${({ $error }) => $error ? '#ffc5c2' : '#c9f8d9'};
  background: rgba(4,10,16,.58);
  font-size: .72rem;
  line-height: 1.35;
`;
