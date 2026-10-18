import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../frontend/src/util/missingQuantity.js',import.meta.url),'utf8');
const {missingQuantityBounds,initialMissingQuantity,isValidMissingQuantity}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('single item reports start at one; larger reports remain bounded by inventory',()=>{
  assert.equal(initialMissingQuantity({quantity:1},'report'),1);
  const bounds=missingQuantityBounds({quantity:5},'report');
  assert.deepEqual(bounds,{min:1,max:5});
  for(const value of [1,2,5])assert.equal(isValidMissingQuantity(value,bounds),true);
  for(const value of ['',0,-1,6,1.5,'not a number'])assert.equal(isValidMissingQuantity(value,bounds),false);
});
test('recovery is capped at the missing count and reports cannot silently reduce an existing report',()=>{
  const item={quantity:10,missing:{quantity:3}};
  assert.deepEqual(missingQuantityBounds(item,'found'),{min:1,max:3});
  assert.equal(initialMissingQuantity(item,'found'),3);
  assert.deepEqual(missingQuantityBounds(item,'report'),{min:3,max:10});
  assert.equal(initialMissingQuantity(item,'report'),3);
});
test('correction retains zero for erroneous reports; invalid inventory and empty recoveries cannot save',()=>{
  assert.equal(isValidMissingQuantity(0,missingQuantityBounds({quantity:1,missing:{quantity:1}},'correction')),true);
  assert.equal(isValidMissingQuantity(1,missingQuantityBounds({quantity:0},'report')),false);
  assert.equal(isValidMissingQuantity(1,missingQuantityBounds({quantity:5},'found')),false);
});
