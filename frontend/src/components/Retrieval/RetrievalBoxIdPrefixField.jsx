import BoxIdPrefixInput from '../BoxIdPrefixInput';
import { normalizeBoxId } from '../../util/boxLocator';
import * as S from './Retrieval.styles';

const MAX_BOX_PREFIX_LENGTH = 3;

function getBoxPrefixScope(value) {
  if (!value) return 'BOX';
  if (value.length === 1) return `${value}XX`;
  if (value.length === 2) return `${value}X`;
  return `#${value}`;
}

export default function RetrievalBoxIdPrefixField({ value = '', onChange }) {
  const normalizedValue = normalizeBoxId(value).slice(0, MAX_BOX_PREFIX_LENGTH);
  const updateValue = (nextValue) => {
    onChange?.(normalizeBoxId(nextValue).slice(0, MAX_BOX_PREFIX_LENGTH));
  };

  return (
    <S.BoxPrefixWrap $active={Boolean(normalizedValue)}>
      <S.SearchLabel>Filter boxes by three-digit box number</S.SearchLabel>
      <BoxIdPrefixInput
        inputAs={S.BoxPrefixInput}
        $active={Boolean(normalizedValue)}
        id="retrieval-console-box-prefix"
        namePrefix="retrieval_box_prefix"
        value={normalizedValue}
        maxLength={MAX_BOX_PREFIX_LENGTH}
        placeholder="000"
        ariaLabel="Filter boxes by three-digit box number prefix"
        title="Box number: 1 shows 1XX, 10 shows 10X, and 105 shows box 105"
        onChange={(event) => updateValue(event.target.value)}
        onPaste={(event) => {
          event.preventDefault();
          updateValue(event.clipboardData?.getData('text') || '');
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || !normalizedValue) return;
          event.preventDefault();
          updateValue('');
        }}
      />
      <S.BoxPrefixScope aria-live="polite">
        {getBoxPrefixScope(normalizedValue)}
      </S.BoxPrefixScope>
    </S.BoxPrefixWrap>
  );
}
