import { useContext } from 'react';
import ItemQuantityRowControl from '../ItemFieldEditor/ItemQuantityRowControl';
import ItemDropdownRowControl from '../ItemFieldEditor/ItemDropdownRowControl';
import { getItemFieldDescriptor } from '../ItemFieldEditor/itemFieldRegistry';
import { ToastContext } from '../Toast';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekItemFacts({ item, onSaved }) {
  const { showToast } = useContext(ToastContext) || {};
  const failed = error => showToast?.({ variant: 'danger', title: 'SAVE FAILED', message: error.message || 'Could not save. Try again.', timeoutMs: 0 });
  const saved = patch => {
    onSaved?.(patch.updated);
    showToast?.({ variant: 'success', title: 'UPDATED', message: `${patch.descriptor.label} saved.`, timeoutMs: 2200 });
  };
  return <S.ItemCarouselMeta>
    <S.ItemFact><S.ItemFactLabel>Quantity</S.ItemFactLabel>
      <ItemQuantityRowControl item={item} onSaved={saved} onError={failed} />
    </S.ItemFact>
    <S.ItemFact><S.ItemFactLabel>Category</S.ItemFactLabel>
      <ItemDropdownRowControl item={item} descriptor={getItemFieldDescriptor('category', item)} onSaved={saved} onError={failed} />
    </S.ItemFact>
  </S.ItemCarouselMeta>;
}
