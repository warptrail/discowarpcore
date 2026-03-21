import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
`;

const Thumb = styled.img`
  width: 34px;
  height: 34px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.22);
  flex: 0 0 auto;
`;

const BoxIdChip = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 1px 6px rgba(0, 0, 0, 0.22);
  color: #fff;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.96rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1;
  white-space: nowrap;
`;

export default function RandomItemToastContent({ boxIdLabel, thumbUrl }) {
  const chipText =
    String(boxIdLabel || '').trim().toLowerCase() === 'orphaned'
      ? 'ORPHANED'
      : `BOX ${boxIdLabel}`;

  return (
    <Wrap>
      {thumbUrl ? (
        <Thumb
          src={thumbUrl}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <BoxIdChip>{chipText}</BoxIdChip>
    </Wrap>
  );
}
