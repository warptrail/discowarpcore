const DECLUTTER_BOX_PURPOSES = [
  'standard',
  'donation_staging',
  'sale_staging',
  'gift_staging',
  'discard_staging',
];

const STAGING_BOX_PURPOSES = DECLUTTER_BOX_PURPOSES.filter(
  (purpose) => purpose !== 'standard'
);

const BOX_PURPOSE_BY_ROUTE = {
  discard: 'discard_staging',
  donate: 'donation_staging',
  sell: 'sale_staging',
  gift: 'gift_staging',
};

function getBoxPurposeForRoute(route) {
  return BOX_PURPOSE_BY_ROUTE[String(route || '').trim().toLowerCase()] || null;
}

module.exports = {
  DECLUTTER_BOX_PURPOSES,
  STAGING_BOX_PURPOSES,
  BOX_PURPOSE_BY_ROUTE,
  getBoxPurposeForRoute,
};
