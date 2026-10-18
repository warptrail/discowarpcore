import QuantityInput from '../QuantityInput';
import * as S from './MissingItemSheet.styles';

export default function MissingQuantityField({ bounds, count, onChange, disabled, found, correction }) {
  if (bounds.max <= 1 && !correction) return null;
  return <S.QuantityGroup>
    <S.QuantityHeading><span>{found ? 'Recovered and put away' : 'Total missing'}</span>
      <span>{count} of {bounds.max}</span></S.QuantityHeading>
    <S.QuantityControls>
      <QuantityInput compact fullWidth min={bounds.min} max={bounds.max} value={count}
        disabled={disabled} ariaLabel={found ? 'Recovered quantity' : 'Missing quantity'} onChange={value => onChange(String(value))} />
      <S.Preset type="button" disabled={disabled || bounds.min > 1} aria-pressed={Number(count) === 1} onClick={() => onChange('1')}>One</S.Preset>
      <S.Preset type="button" disabled={disabled} aria-pressed={Number(count) === bounds.max} onClick={() => onChange(String(bounds.max))}>All</S.Preset>
    </S.QuantityControls>
  </S.QuantityGroup>;
}
