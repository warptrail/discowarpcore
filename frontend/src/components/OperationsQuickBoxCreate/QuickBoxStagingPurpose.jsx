import * as S from './OperationsQuickBoxCreate.styles';

const PURPOSE_OPTIONS = [
  {
    value: 'standard',
    label: 'Inventory',
    hint: 'Keep and retrieve',
    tone: '#4cc6c1',
  },
  {
    value: 'gift_staging',
    label: 'Gift',
    hint: 'Hold for gifting',
    tone: '#f09ab8',
  },
  {
    value: 'donation_staging',
    label: 'Donation',
    hint: 'Hold to donate',
    tone: '#a78bfa',
  },
  {
    value: 'sale_staging',
    label: 'Sell',
    hint: 'Hold to sell',
    tone: '#e8b15c',
  },
];

export default function QuickBoxStagingPurpose({ value, onChange }) {
  return (
    <S.StagingField>
      <S.Label>Box role</S.Label>
      <S.StagingOptions role="radiogroup" aria-label="Box staging role">
        {PURPOSE_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <S.StagingOption
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              $active={active}
              $tone={option.tone}
              onClick={() => onChange(option.value)}
            >
              <S.StagingLight aria-hidden="true" $active={active} $tone={option.tone} />
              <span>
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </span>
            </S.StagingOption>
          );
        })}
      </S.StagingOptions>
    </S.StagingField>
  );
}
