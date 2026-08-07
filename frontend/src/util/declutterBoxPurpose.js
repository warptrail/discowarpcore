export const DECLUTTER_BOX_PURPOSE_BY_ROUTE = {
  discard: 'discard_staging',
  donate: 'donation_staging',
  sell: 'sale_staging',
  gift: 'gift_staging',
};

export const DECLUTTER_BOX_PURPOSE_LABELS = {
  discard_staging: 'Trash staging',
  donation_staging: 'Donation staging',
  sale_staging: 'Sale staging',
  gift_staging: 'Gift staging',
};

export function getDeclutterBoxPurposeForRoute(route) {
  return DECLUTTER_BOX_PURPOSE_BY_ROUTE[String(route || '').trim().toLowerCase()] || '';
}

