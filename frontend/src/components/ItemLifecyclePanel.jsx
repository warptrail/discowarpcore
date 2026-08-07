import EditItemLifecycleSection from './EditItemDetailsForm/EditItemLifecycleSection';
import ItemDepartureAlert from './ItemDepartureAlert';
import { isItemPendingDeparture } from '../util/itemDeparture';

export default function ItemLifecyclePanel({
  item,
  disabled = false,
  onMoveItem,
  onMarkGoneRequest,
  onReclaimRequest,
}) {
  if (isItemPendingDeparture(item)) {
    return (
      <ItemDepartureAlert
        item={item}
        disabled={disabled}
        onMoveItem={onMoveItem}
        onMarkGoneRequest={onMarkGoneRequest}
      />
    );
  }

  return (
    <EditItemLifecycleSection
      item={item}
      disabled={disabled}
      onMarkGoneRequest={onMarkGoneRequest}
      onReclaimRequest={onReclaimRequest}
    />
  );
}
