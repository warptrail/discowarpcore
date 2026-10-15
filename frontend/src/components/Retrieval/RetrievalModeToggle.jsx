import * as S from './Retrieval.styles';
import { ControlToggleGroup, ControlToggleButton } from './RetrievalControlToggle.styles';

export default function RetrievalModeToggle({ mode = 'items', onChange, compact = false, desktop = false }) {
  const Group = desktop ? ControlToggleGroup : S.ModeToggleGroup;
  const Button = desktop ? ControlToggleButton : S.ModeToggleButton;
  return (
    <S.ModeToggleRow>
      <Group role="tablist" aria-label="Retrieval mode" $compact={compact}>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === 'items'}
          $active={mode === 'items'}
          $compact={compact}
          onClick={() => onChange?.('items')}
        >
          Items
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === 'boxes'}
          $active={mode === 'boxes'}
          $compact={compact}
          onClick={() => onChange?.('boxes')}
        >
          Boxes
        </Button>
      </Group>
    </S.ModeToggleRow>
  );
}
