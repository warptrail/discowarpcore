import styled, { css } from 'styled-components';

export const NestPanel = styled.div`
  background: #171717;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  margin-top: 0;
  display: none;

  ${({ $open }) =>
    $open &&
    css`
      display: block;
      margin-top: 12px;
    `}
`;

export const SectionInner = styled.div`
  padding: 12px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
`;

export const Title = styled.h4`
  margin: 0;
  font-size: 15px;
  color: #eaeaea;
`;

export const Note = styled.div`
  font-size: 12px;
  color: #bdbdbd;
`;

export const ContextCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
`;

export const ContextTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-weight: 800;
  font-size: 15px;
  color: #eaeaea;
`;

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
  background: rgba(78, 199, 123, 0.16);
  border: 1px solid rgba(78, 199, 123, 0.35);
  color: rgba(220, 255, 235, 0.95);
`;

export const Breadcrumb = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

export const Crumb = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
`;

export const Sep = styled.span`
  color: rgba(255, 255, 255, 0.35);
`;

export const SubLabel = styled.div`
  margin-top: 10px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.82);
`;

export const Hint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

export const SmallBtn = styled.button`
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const WarnBtn = styled(SmallBtn)`
  border-color: rgba(255, 212, 0, 0.35);
  background: rgba(255, 212, 0, 0.08);

  &:hover {
    border-color: rgba(255, 212, 0, 0.55);
    background: rgba(255, 212, 0, 0.12);
  }
`;

export const Grid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr;
  @media (min-width: 520px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 760px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

export const BoxBtn = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid
    ${({ $disabled, $selected }) =>
      $selected ? '#4ec77b' : $disabled ? '#2a2a2a' : '#2a2a2a'};
  background: ${({ $disabled }) => ($disabled ? '#141414' : '#1a1a1a')};
  color: #eaeaea;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.08s ease;

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? '#2a2a2a' : '#4ec77b')};
  }
  &:active {
    transform: translateY(1px);
  }
`;

export const Meta = styled.div`
  font-size: 12px;
  color: #bdbdbd;
`;

export const DepthStrip = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  height: 6px;
  align-items: center;
`;

export const DepthSeg = styled.div`
  flex: 1 1 0;
  height: 6px;
  border-radius: 999px;
  background: ${({ $level }) =>
    `rgba(78, 199, 123, ${Math.min(0.15 + $level * 0.12, 0.9)})`};
`;

export const GhostBtn = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #2f2f2f;
  background: #141414;
  color: #eaeaea;
  cursor: pointer;

  &:hover {
    border-color: #4ec77b;
  }
`;
