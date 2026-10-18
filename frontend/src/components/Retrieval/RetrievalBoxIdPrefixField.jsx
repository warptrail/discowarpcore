import BoxIdPrefixInput from '../BoxIdPrefixInput';
import { normalizeBoxAddress } from '../../util/boxAddress';
import * as S from './Retrieval.styles';


export default function RetrievalBoxIdPrefixField({ value = '', onChange, onActivate }) {
  const normalizedValue = normalizeBoxAddress(value);
  const updateValue = (nextValue) => {
    onChange?.(normalizeBoxAddress(nextValue));
  };

  return (
    <S.BoxPrefixWrap $active={Boolean(normalizedValue)}>
      <S.SearchLabel>Filter by box address</S.SearchLabel>
      <BoxIdPrefixInput
        inputAs={S.BoxPrefixInput}
        $active={Boolean(normalizedValue)}
        id="retrieval-console-box-prefix"
        namePrefix="retrieval_box_prefix"
        value={normalizedValue}
        maxLength={32}
        placeholder=""
        ariaLabel="Filter boxes by box, cabinet, or shelf address"
        title="Box address: 5, 504, 504B, or 504B2"
        onChange={(event) => updateValue(event.target.value)}
        onPaste={(event) => {
          event.preventDefault();
          updateValue(event.clipboardData?.getData('text') || '');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); onActivate?.(); }
          if (event.key !== 'Escape' || !normalizedValue) return;
          event.preventDefault();
          updateValue('');
        }}
      />
      {!normalizedValue ? <S.BoxPrefixClockHint aria-hidden="true">000</S.BoxPrefixClockHint> : null}
    </S.BoxPrefixWrap>
  );
}
