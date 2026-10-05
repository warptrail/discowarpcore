import { controlStyles } from '../../styles/primitives';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { formatTokenLabel } from '../../constants/renderTokens';
import tokenColorsCsv from '../../assets/token-colors.csv?raw';
import {
  ensureTokenColorMapLoaded,
  getTokenSurfaceColors,
} from '../../util/tokenColorMap';

const PickerShell = styled.div`
  display: grid;
  gap: 0.34rem;
`;

const PickerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.34rem;
  flex-wrap: wrap;
`;

const PickerTitleBlock = styled.div`
  display: grid;
  gap: 0.08rem;
  min-width: 0;
`;

const PickerEyebrow = styled.span`
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
`;

const PickerTitle = styled.span`
  color: var(--dw-text-secondary);
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.2;
`;

const BackButton = styled.button`
  min-height: 29px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: linear-gradient(180deg, rgba(26, 60, 83, 0.96) 0%, rgba(17, 43, 62, 0.96) 100%);
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: none;
  letter-spacing: 0;
  padding: 0 0.56rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  ${controlStyles}
  flex: 0 0 auto;
  color: var(--dw-violet);
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.3rem;

  @media (max-width: 820px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const OptionTile = styled.button`
  ${controlStyles}
  min-height: 68px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid ${({ $selected, $borderColor }) =>
    $selected ? 'rgba(214, 242, 255, 0.92)' : $borderColor};
  background:
    linear-gradient(180deg, ${({ $gradientStart }) => $gradientStart} 0%, ${({ $gradientEnd }) => $gradientEnd} 100%);
  color: ${({ $textColor }) => $textColor};
  text-align: left;
  padding: 0.46rem 0.5rem;
  display: grid;
  align-content: space-between;
  gap: 0.18rem;
  cursor: pointer;
  box-shadow: ${({ $selected, $borderColor }) =>
    $selected
      ? `inset 0 0 0 1px rgba(255,255,255,0.2), 0 0 0 1px ${$borderColor}`
      : 'inset 0 0 0 1px rgba(255,255,255,0.04)'};

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  box-shadow: none;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const OptionName = styled.span`
  font-size: 0.74rem;
  font-weight: 760;
  line-height: 1.18;
`;

const OptionMeta = styled.span`
  font-size: 0.75rem;
  letter-spacing: 0;
  text-transform: none;
  color: ${({ $textColor }) => $textColor};
  opacity: 0.78;
`;

export default function RenderTokenOptionPicker({
  fieldKey = '',
  fieldLabel = '',
  currentValue = '',
  options = [],
  disabled = false,
  onSelect = null,
  onBack = null,
}) {
  ensureTokenColorMapLoaded(tokenColorsCsv);

  const safeOptions = useMemo(
    () => (Array.isArray(options) ? options : []).filter((option) => option?.id),
    [options],
  );

  return (
    <PickerShell>
      <PickerHeader>
        <PickerTitleBlock>
          <PickerEyebrow>Choose Token</PickerEyebrow>
          <PickerTitle>{fieldLabel || formatTokenLabel(fieldKey)}</PickerTitle>
        </PickerTitleBlock>
        <BackButton type="button" onClick={onBack} disabled={disabled}>
          Back
        </BackButton>
      </PickerHeader>

      <OptionGrid>
        {safeOptions.map((option) => {
          const optionId = String(option.id || '').trim();
          const selected = optionId === currentValue;
          const surfaceColors = getTokenSurfaceColors(optionId, fieldKey);

          return (
            <OptionTile
              key={optionId}
              type="button"
              $selected={selected}
              aria-pressed={selected}
              $borderColor={surfaceColors.borderColor}
              $gradientStart={surfaceColors.gradientStart}
              $gradientEnd={surfaceColors.gradientEnd}
              $textColor={surfaceColors.textColor}
              disabled={disabled}
              onClick={() => onSelect?.(optionId)}
            >
              <OptionName>{option.label || formatTokenLabel(optionId)}</OptionName>
              <OptionMeta $textColor={surfaceColors.textColor}>
                {selected ? 'Selected' : fieldLabel}
              </OptionMeta>
            </OptionTile>
          );
        })}
      </OptionGrid>
    </PickerShell>
  );
}
