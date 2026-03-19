import React from 'react';
import styled from 'styled-components';
import ImageSourcePicker from '../ImageSourcePicker';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
`;

const SourceButton = styled.button`
  min-height: ${({ $compact }) => ($compact ? '34px' : '42px')};
  border-radius: 8px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'camera'
        ? 'rgba(111, 196, 138, 0.66)'
        : $tone === 'photos'
          ? 'rgba(101, 154, 214, 0.66)'
          : 'rgba(177, 151, 101, 0.66)'};
  background: ${({ $tone }) =>
    $tone === 'camera'
      ? 'rgba(18, 49, 36, 0.95)'
      : $tone === 'photos'
        ? 'rgba(16, 36, 62, 0.95)'
        : 'rgba(55, 40, 18, 0.95)'};
  color: #eaf2ff;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 0.62rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${({ $compact }) => ($compact ? MOBILE_CONTROL_MIN_HEIGHT : `calc(${MOBILE_CONTROL_MIN_HEIGHT} + 4px)`)};
    font-size: ${({ $compact }) => ($compact ? MOBILE_FONT_XS : MOBILE_FONT_SM)};
  }
`;

const SOURCE_CONFIGS = [
  { id: 'camera', label: 'Camera', tone: 'camera', capture: 'environment' },
  { id: 'photos', label: 'Photos', tone: 'photos' },
  { id: 'files', label: 'Files', tone: 'files' },
];

export default function IntakePhotoSourceButtons({
  disabled = false,
  compact = false,
  onFileSelected,
}) {
  return (
    <Row>
      {SOURCE_CONFIGS.map((config) => (
        <ImageSourcePicker
          key={config.id}
          source={config.id}
          label={config.label}
          capture={config.capture}
          disabled={disabled}
          onFileSelected={onFileSelected}
          renderAction={({ label, onClick, disabled: actionDisabled }) => (
            <SourceButton
              type="button"
              $tone={config.tone}
              $compact={compact}
              onClick={onClick}
              disabled={actionDisabled}
            >
              {label}
            </SourceButton>
          )}
        />
      ))}
    </Row>
  );
}
