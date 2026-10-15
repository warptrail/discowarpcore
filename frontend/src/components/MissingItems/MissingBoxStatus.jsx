import { useMissingItems } from './MissingItemsContext';
import { Status } from './MissingItems.styles';
export default function MissingBoxStatus({ box }) {
  const { items, states, loading } = useMissingItems();
  const id = String(box?._id || box?.id || '');
  let records;
  if (loading && Array.isArray(box?.items) && box.items.every(item => typeof item === 'object')) {
    records = box.items.filter(item => Number((states[String(item._id)] || item).missing?.quantity || 0) > 0).length;
  } else records = items.filter(item => String(item.box?._id || '') === id).length;
  if (!records) return null;
  return <Status>{records} {records === 1 ? 'item record' : 'item records'} missing</Status>;
}
