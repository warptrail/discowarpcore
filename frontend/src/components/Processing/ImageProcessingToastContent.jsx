import React from 'react';
import styled from 'styled-components';
import { normalizeImageProcessingPercent } from './imageProcessingToastUtils';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

const Wrap = styled.div`
  display: grid;
  gap: 0.42rem;
  min-width: 0;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  min-width: 0;
`;

const StatusPill = styled.span`
  border: 1px solid rgba(176, 222, 246, 0.42);
  border-radius: 999px;
  padding: 0.12rem 0.42rem;
  color: rgba(235, 248, 255, 0.94);
  background: rgba(5, 18, 28, 0.34);
  font-size: 0.66rem;
  font-weight: 780;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const MetaText = styled.span`
  min-width: 0;
  color: rgba(234, 246, 255, 0.88);
  font-size: 0.78rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
`;

const Track = styled.div`
  position: relative;
  overflow: hidden;
  height: 10px;
  border-radius: 999px;
  background: rgba(3, 10, 16, 0.62);
  border: 1px solid rgba(197, 230, 247, 0.22);
`;

const Fill = styled.div`
  width: ${({ $percent }) => `${$percent}%`};
  height: 100%;
  min-width: ${({ $indeterminate }) => ($indeterminate ? '34%' : '0')};
  border-radius: inherit;
  background: linear-gradient(90deg, #64d2ff 0%, #8ff0c6 58%, #f7d774 100%);
  box-shadow: 0 0 14px rgba(100, 210, 255, 0.42);
  transition: width 180ms ease;
`;

const Detail = styled.div`
  color: rgba(219, 236, 247, 0.76);
  font-size: 0.68rem;
  line-height: 1.3;
`;

export default function ImageProcessingToastContent({
  status = '',
  label = '',
  progressPercent = null,
  entityLabel = '',
  jobId = '',
}) {
  const normalizedStatus = toTrimmed(status).toLowerCase();
  const percent = normalizeImageProcessingPercent(progressPercent);
  const statusLabel =
    normalizedStatus === 'queued'
      ? 'Queued'
      : normalizedStatus === 'processing'
        ? percent == null ? 'Processing' : `Processing ${percent}%`
        : normalizedStatus || 'Processing';
  const progressWidth = percent == null
    ? normalizedStatus === 'queued' ? 8 : 34
    : percent;
  const detailParts = [
    toTrimmed(entityLabel),
    toTrimmed(jobId) ? `Job ${toTrimmed(jobId)}` : '',
  ].filter(Boolean);

  return (
    <Wrap>
      <MetaRow>
        <StatusPill>{statusLabel}</StatusPill>
        <MetaText>{toTrimmed(label) || 'ObjectGlow/media processing is running.'}</MetaText>
      </MetaRow>
      <Track aria-label="Image processing progress">
        <Fill
          $percent={progressWidth}
          $indeterminate={percent == null && normalizedStatus === 'processing'}
        />
      </Track>
      {detailParts.length ? <Detail>{detailParts.join(' · ')}</Detail> : null}
    </Wrap>
  );
}
