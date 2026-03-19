// src/api/editItem.js
import { API_BASE } from './API_BASE'; // adjust path if needed
export async function editItem(itemId, payload) {
  // Remove disallowed virtual fields
  const {
    name,
    quantity,
    description,
    notes,
    tags,
    links,
    imagePath,
    location,
    orphanedAt,
    valueCents,
    dateAcquired,
    dateLastUsed,
    usageHistory,
    checkHistory,
    keepPriority,
    condition,
    category,
    isConsumable,
    minimumDesiredQuantity,
    lastCheckedAt,
    acquisitionType,
    purchasePriceCents,
    primaryOwnerName,
    lastMaintainedAt,
    maintenanceHistory,
    maintenanceNotes,
  } = payload;

  const safePayload = {
    name,
    quantity,
    description,
    notes,
    tags,
    links,
    imagePath,
    location,
    orphanedAt,
    valueCents,
    dateAcquired,
    dateLastUsed,
    usageHistory,
    checkHistory,
    keepPriority,
    condition,
    category,
    isConsumable,
    minimumDesiredQuantity,
    lastCheckedAt,
    acquisitionType,
    purchasePriceCents,
    primaryOwnerName,
    lastMaintainedAt,
    maintenanceHistory,
    maintenanceNotes,
  };

  const url = `${API_BASE}/api/items/${itemId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(safePayload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update item (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data?.data || data;
}
