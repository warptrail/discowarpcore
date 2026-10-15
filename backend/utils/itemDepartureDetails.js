const FIELDS = {
  saleDetails: { buyer:300, paymentType:20, tradedFor:1000 },
  giftDetails: { recipient:300, occasion:1000 },
};
const fail = message => { throw Object.assign(new Error(message), {status:400}); };

function normalizeDetails(field, value) {
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${field} must be an object or null.`);
  const allowed = [...Object.keys(FIELDS[field]), ...(field==='saleDetails' ? ['amountCents'] : [])];
  if (Object.keys(value).some(key=>!allowed.includes(key))) fail(`Unsupported ${field} field.`);
  const result = {};
  for (const [key,max] of Object.entries(FIELDS[field])) {
    const raw = value[key] ?? '';
    if (typeof raw !== 'string' || raw.length>max) fail(`${key} must be text of at most ${max} characters.`);
    result[key]=raw.trim();
  }
  if (field==='saleDetails') {
    result.amountCents=value.amountCents ?? null;
    if (result.amountCents!==null && (!Number.isSafeInteger(result.amountCents) || result.amountCents<0)) fail('Sale amount must be nonnegative integer cents.');
    if (!['','dollars','trade'].includes(result.paymentType)) fail('Choose dollars or trade.');
    if (result.paymentType==='trade' && result.amountCents!==null) fail('A trade cannot include a dollar sale amount.');
    if (result.paymentType==='dollars' && result.tradedFor) fail('A dollar sale cannot include trade details.');
    if (!result.paymentType && (result.amountCents!==null || result.tradedFor)) fail('Choose dollars or trade for the sale details.');
  }
  return result;
}

function detailValues(field, details) {
  if (!details) return null;
  return normalizeDetails(field,Object.fromEntries(
    [...Object.keys(FIELDS[field]),...(field==='saleDetails'?['amountCents']:[])].map(key=>[key,details[key]])
  ));
}

// Audit metadata is server-owned. Details and their revision append in the same item update.
function buildDepartureDetailsUpdate(existing, input, {disposition=existing.disposition,actor='',at=new Date()}={}) {
  const set = {}; const revisions = [];
  for (const [key,value] of Object.entries(input)) {
    if (key.startsWith('$') && value && typeof value==='object'
      && Object.keys(value).some(path=>/^(saleDetails|giftDetails|departureDetailsHistory)(\.|$)/.test(path))) fail('Departure details must use ordinary object fields.');
  }
  if ('departureDetailsHistory' in input || Object.keys(input).some(key=>/^(saleDetails|giftDetails|departureDetailsHistory)\./.test(key))) fail('Edit departure details as an object; history is read-only.');
  for (const field of Object.keys(FIELDS)) {
    if (!(field in input)) continue;
    const required = field==='saleDetails' ? 'sold' : 'gifted';
    if (disposition!==required) fail(`${field} applies only to ${required} items.`);
    const before = detailValues(field,existing[field]);
    const submitted = input[field];
    if (submitted!==null && (!submitted || typeof submitted!=='object' || Array.isArray(submitted))) fail(`${field} must be an object or null.`);
    const after = normalizeDetails(field,submitted===null ? null : {...(before || {}),...submitted});
    if (JSON.stringify(before)===JSON.stringify(after)) continue;
    const changedFields = [...new Set([...Object.keys(before || {}),...Object.keys(after || {})])]
      .filter(key=>before?.[key]!==after?.[key]);
    set[field]=after===null ? null : {...after,createdAt:existing[field]?.createdAt || at,updatedAt:at};
    revisions.push({field,at,actor:String(actor || ''),changedFields,before,after});
  }
  return {set,revisions};
}
module.exports = {normalizeDetails,buildDepartureDetailsUpdate};
