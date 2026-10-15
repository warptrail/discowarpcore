import { createContext, useContext } from 'react';
export const MissingItemsContext = createContext({ items: [], summary: { records: 0, objects: 0 }, states: {}, loading: true, error: '', open: () => {}, refresh: () => {} });
export function useMissingItems() { return useContext(MissingItemsContext); }
export function useMissingItem(item) {
  const { states } = useMissingItems();
  const current = states[String(item?._id || item?.id || '')];
  if (!current) return item;
  const sourceIsNewer = (item?.missing?.revision || 0) > (current.missing?.revision || 0) ||
    (item?.updatedAt && current.updatedAt && Date.parse(item.updatedAt) > Date.parse(current.updatedAt));
  if (sourceIsNewer) return item;
  return { ...item, quantity: current.quantity ?? item.quantity, missing: current.missing, isMissing: current.missing.quantity > 0 };
}
