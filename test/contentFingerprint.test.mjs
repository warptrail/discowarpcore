import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256, canonicalItemContent, getItemContentFingerprint } from '../frontend/src/util/contentFingerprint.js';
import { getInventoryObjectShape } from '../frontend/src/util/inventoryObjectShape.js';

const item = { name:'Solar Lights', quantity:12, description:'Camping light', notes:'Pack gently', tags:['camping','lights'], category:'miscellaneous', location:'Closet', primaryOwnerName:'Household', keepPriority:'high' };
test('SHA-256 matches known vectors and Node including Unicode and multiblock input', () => {
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  for (const value of ['Solar ☀️ café 日本語', 'a'.repeat(1000), '𐐷'.repeat(32), 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64)]) {
    assert.equal(sha256(value), createHash('sha256').update(value).digest('hex'));
  }
});
test('every selected editable field changes fingerprint and art; identifiers and timestamps do not', () => {
  const fingerprint = getItemContentFingerprint(item), art = getInventoryObjectShape(item);
  for (const [field,value] of Object.entries({...item,label:'Solar kit'})) {
    const edited = {...item,[field]:field==='quantity'?13:field==='tags'?['outdoors']:String(value)+' edited'};
    assert.notEqual(getItemContentFingerprint(edited),fingerprint,field);
    assert.notDeepEqual(getInventoryObjectShape(edited),art,field);
  }
  assert.equal(getItemContentFingerprint({...item,_id:'new',updatedAt:'later',imagePath:'/somewhere'}),fingerprint);
  assert.deepEqual(getInventoryObjectShape({...item}),art);
});
test('canonical content normalizes Unicode, whitespace, numeric quantity and tag order/case', () => {
  const first = {name:' Café  Light ',quantity:'12',tags:['#LIGHTS','camping','lights'],description:'Two\n lights'};
  const second = {name:'Cafe\u0301 Light',quantity:12,tags:[{value:'camping'},'lights'],description:'Two lights'};
  assert.equal(canonicalItemContent(first),canonicalItemContent(second));
  const variants = Array.from({length:40},(_,i)=>getInventoryObjectShape({...item,name:`Fixture ${i}`,quantity:i+1}));
  assert.equal(new Set(variants.map(JSON.stringify)).size,40);
  for (const faces of variants) for (const face of faces) {
    assert.ok(['front','side','top'].includes(face.shade));
    for (const pair of face.points.split(' ')) {
      const [x,y]=pair.split(',').map(Number);assert.ok(x>=0&&x<=120&&y>=0&&y<=110);
    }
  }
});
