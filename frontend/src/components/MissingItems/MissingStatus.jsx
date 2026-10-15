import { useMissingItem } from './MissingItemsContext';
import { Status } from './MissingItems.styles';
export default function MissingStatus({ item, home = false }) {
  const current = useMissingItem(item);
  const quantity = Number(current?.missing?.quantity || 0);
  if (!quantity || current?.item_status === 'gone') return null;
  return <Status>{current.quantity === 1 ? 'Missing' : `${quantity} of ${current.quantity ?? '?'} missing`}{home ? ' · Recorded home' : ''}</Status>;
}
