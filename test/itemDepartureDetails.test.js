const test=require('node:test');
const assert=require('node:assert/strict');
const {buildDepartureDetailsUpdate,normalizeDetails}=require('../backend/utils/itemDepartureDetails');
const at=new Date('2026-10-13T20:00:00Z');
test('sale captures cents, timestamps and actor in an appendable before/after revision',()=>{
  const result=buildDepartureDetailsUpdate({}, {saleDetails:{buyer:' Pat ',paymentType:'dollars',amountCents:1250}}, {disposition:'sold',actor:'discofish',at});
  assert.equal(result.set.saleDetails.buyer,'Pat');assert.equal(result.set.saleDetails.amountCents,1250);
  assert.equal(result.set.saleDetails.createdAt,at);assert.equal(result.set.saleDetails.updatedAt,at);
  assert.equal(result.revisions[0].actor,'discofish');assert.equal(result.revisions[0].before,null);
  assert.equal(result.revisions[0].after.amountCents,1250);
});
test('partial corrections preserve creation time and capture each changed field; identical values do not revise',()=>{
  const created=new Date('2026-10-12T20:00:00Z');
  const previous={recipient:'Pat',occasion:'Birthday',createdAt:created,updatedAt:created};
  const result=buildDepartureDetailsUpdate({giftDetails:previous,disposition:'gifted'},{giftDetails:{occasion:'Graduation'}},{at});
  assert.equal(result.set.giftDetails.createdAt,created);assert.equal(result.set.giftDetails.updatedAt,at);
  assert.deepEqual(result.revisions[0].changedFields,['occasion']);assert.equal(result.revisions[0].before.occasion,'Birthday');
  assert.equal(buildDepartureDetailsUpdate({giftDetails:previous,disposition:'gifted'},{giftDetails:{occasion:'Birthday'}}).revisions.length,0);
  const cleared=buildDepartureDetailsUpdate({giftDetails:previous,disposition:'gifted'},{giftDetails:null},{at});
  assert.equal(cleared.set.giftDetails,null);assert.equal(cleared.revisions[0].after,null);
});
test('optional omission leaves existing records untouched and a zero dollar sale remains zero',()=>{
  assert.deepEqual(buildDepartureDetailsUpdate({},{}),{set:{},revisions:[]});
  assert.equal(normalizeDetails('saleDetails',{paymentType:'dollars',amountCents:0}).amountCents,0);
  assert.equal(normalizeDetails('saleDetails',{paymentType:'trade',tradedFor:'A lamp'}).tradedFor,'A lamp');
});
test('rejects mismatched outcomes, unsafe amounts, mixed payment and forged audit metadata',()=>{
  for (const amountCents of [-1,12.5,Infinity,'10',Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>normalizeDetails('saleDetails',{paymentType:'dollars',amountCents}));
  assert.throws(()=>normalizeDetails('saleDetails',{paymentType:'trade',amountCents:100}));
  assert.throws(()=>normalizeDetails('saleDetails',{paymentType:'dollars',tradedFor:'Lamp'}));
  for(const input of [{saleDetails:[]},{saleDetails:{createdAt:at}},{departureDetailsHistory:[]},{'saleDetails.buyer':'x'},{$set:{saleDetails:{buyer:'x'}}}]) assert.throws(()=>buildDepartureDetailsUpdate({},input,{disposition:'sold'}));
  assert.throws(()=>buildDepartureDetailsUpdate({}, {giftDetails:{recipient:'x'}},{disposition:'sold'}));
});
test('Mongoose optional objects remain absent on legacy records and retain audit snapshots',()=>{
  const Item=require('../backend/models/Item');
  const item=new Item({name:'Synthetic item'});
  assert.equal(item.saleDetails,undefined);assert.equal(item.giftDetails,undefined);assert.equal(item.departureDetailsHistory,undefined);
  const result=buildDepartureDetailsUpdate({}, {giftDetails:{recipient:'Pat',occasion:'Birthday'}},{disposition:'gifted',at});
  item.giftDetails=result.set.giftDetails;item.departureDetailsHistory=result.revisions;
  assert.equal(item.giftDetails.recipient,'Pat');assert.equal(item.departureDetailsHistory[0].at.toISOString(),at.toISOString());
});

test('completion validates before inventory writes and atomically saves details plus revisions',async t=>{
  const Item=require('../backend/models/Item');const Box=require('../backend/models/Box');
  const events=require('../backend/services/eventLogService');
  const originalLog=events.logEventBestEffort;events.logEventBestEffort=async()=>{};
  const servicePath=require.resolve('../backend/services/itemService');delete require.cache[servicePath];
  const {markItemGone,updateItem}=require(servicePath);
  const originals={find:Item.findById,update:Item.findByIdAndUpdate,boxFind:Box.findOne,boxUpdate:Box.updateMany,claim:Item.findOneAndUpdate,release:Item.updateOne};
  t.after(()=>{Item.findById=originals.find;Item.findByIdAndUpdate=originals.update;Item.findOneAndUpdate=originals.claim;Item.updateOne=originals.release;Box.findOne=originals.boxFind;Box.updateMany=originals.boxUpdate;events.logEventBestEffort=originalLog;delete require.cache[servicePath];});
  let current={_id:'synthetic',name:'Synthetic item'};let boxWrites=0;let update;
  Item.findById=()=>({lean:async()=>current});
  Item.findOneAndUpdate=()=>({select(){return this;},lean:async()=>({_id:'synthetic'})});
  Item.updateOne=async()=>({matchedCount:1});
  Box.findOne=()=>({select(){return this;},lean:async()=>null});
  Box.updateMany=async()=>{boxWrites++;};
  Item.findByIdAndUpdate=async(id,changes)=>{update=changes;current={...current,...(changes.$set || changes)};return current;};
  await assert.rejects(markItemGone('synthetic',{disposition:'sold',saleDetails:{paymentType:'dollars',amountCents:-1}}));
  assert.equal(boxWrites,0);
  await markItemGone('synthetic',{disposition:'sold',saleDetails:{buyer:'Pat',paymentType:'dollars',amountCents:2500},player:'laserfox'});
  assert.equal(update.$set.item_status,'gone');assert.equal(update.$set.saleDetails.amountCents,2500);
  assert.equal(update.$push.departureDetailsHistory.$each[0].actor,'laserfox');
  assert.ok(update.$push.departureDetailsHistory.$each[0].at instanceof Date);
  await updateItem('synthetic',{saleDetails:{buyer:'Sam'}});
  assert.equal(update.$set.saleDetails.buyer,'Sam');assert.equal(update.$push.departureDetailsHistory.$each[0].before.buyer,'Pat');
});
