const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const express = require('express');
const Item = require('../backend/models/Item');
const Box = require('../backend/models/Box');
require('../backend/models/Location');
const Candidate = require('../backend/models/DeclutterCandidate');
const routes = require('../backend/routes/declutterDeck');

// Opt-in only. Never load dotenv, the production server, or a household URI.
// Use a NEW empty QA database. Deliberately no drop/delete cleanup.
const uri = process.env.DWC_DECLUTTER_TEST_URI;
test('two-person Declutter workflow on an isolated database', { skip: !uri }, async (t) => {
  const target = new URL(uri);
  assert.equal(target.protocol, 'mongodb:');
  assert.equal(target.hostname, '127.0.0.1');
  assert.notEqual(target.port, '27017');
  assert(target.port && /^\/dwc_qa_declutter_[a-zA-Z0-9_]+$/.test(target.pathname));
  assert(!target.username && !target.password && !target.search);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  t.after(async () => mongoose.disconnect());
  assert.equal(await Item.countDocuments(), 0, 'Use a NEW empty isolated database');
  assert.equal(await Candidate.countDocuments(), 0);
  await Promise.all([Item.init(), Box.init(), Candidate.init()]);
  const app = express(); app.use(express.json()); app.use('/api/declutter-deck', routes);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/declutter-deck`;
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(base + path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, ...await response.json() };
  };
  const deck = player => api(`?player=${player}`);
  const vote = (id, player, choice, notes) => api(`/candidates/${id}/votes`, 'POST', { player, vote: choice, ...(notes === undefined ? {} : { notes }) });
  let sequence = 0;
  const fixture = async (extra = {}) => {
    const item = await Item.create({ name: `QA-DECLUTTER-${++sequence}`, ...extra });
    const response = await api('/candidates', 'POST', { itemId: String(item._id), nominatedBy: 'laserfox' });
    assert.equal(response.status, 201); return { item, id: response.candidate.id };
  };
  const agree = async (f, a, b = a) => { await vote(f.id, 'laserfox', a); const r = await vote(f.id, 'discofish', b); assert.equal(r.status, 200); return r.candidate; };
  const placedBox = item => Box.findOne({ items: item._id }).lean();
  const complexBox = async item => Box.create({ box_id: `QA-B-${sequence}`, label: 'QA organizer', isComplexBox: true, items: [item._id], itemCompartments: { [String(item._id)]: 'B' } });
  await t.test('empty deck and duplicate nomination', async () => {
    assert.equal((await deck('laserfox')).activeCandidates.length, 0);
    const f = await fixture(); const response = await api('/candidates', 'POST', { itemId: String(f.item._id), nominatedBy: 'discofish' });
    assert.equal(response.status, 200); assert.equal(response.created, false);
    assert.equal(await Candidate.countDocuments({ itemId: f.item._id }), 1);
  });
  await t.test('simultaneous votes and private notes survive across 24 rounds', async () => {
    for (let i = 0; i < 24; i++) {
      const f = await fixture();
      const choices = i % 3 === 0 ? ['keep', 'keep'] : i % 3 === 1 ? ['donate', 'sell'] : ['keep', 'toss'];
      const results = await Promise.all([vote(f.id, 'laserfox', choices[0], `LF-${i}`), vote(f.id, 'discofish', choices[1], `DF-${i}`)]);
      assert.deepEqual(results.map(r => r.status), [200, 200]);
      const saved = await Candidate.findById(f.id).lean();
      assert.notEqual(saved.votes.laserfox.decision, 'pending'); assert.notEqual(saved.votes.discofish.decision, 'pending');
      assert.equal(saved.deckState, i % 3 === 0 ? 'resolved' : i % 3 === 1 ? 'action' : 'discussion');
      assert.equal(saved.privateNotes.laserfox, `LF-${i}`); assert.equal(saved.privateNotes.discofish, `DF-${i}`);
      const item = await Item.findById(f.item._id);
      assert.equal(item.declutterReadiness, i % 3 === 0 ? 'kept' : i % 3 === 1 ? 'ready_to_declutter' : 'in_deck');
      assert(!JSON.stringify(results[0]).includes(`DF-${i}`)); assert(!JSON.stringify(results[1]).includes(`LF-${i}`));
    }
  });
  await t.test('rapid duplicate votes remain idempotent before and after consensus', async () => {
    const f = await fixture();
    assert((await Promise.all(Array.from({ length: 8 }, () => vote(f.id, 'laserfox', 'keep')))).every(r => r.status === 200));
    await vote(f.id, 'discofish', 'keep'); const before = await Candidate.findById(f.id).lean();
    assert.equal((await vote(f.id, 'laserfox', 'keep')).status, 200);
    assert.deepEqual((await Candidate.findById(f.id).lean()).votes, before.votes);
  });
  await t.test('legacy missing revision participates safely in concurrent votes', async () => {
    const f = await fixture(); await Candidate.collection.updateOne({ _id: new mongoose.Types.ObjectId(f.id) }, { $unset: { voteRevision: '' } });
    await Promise.all([vote(f.id, 'laserfox', 'keep'), vote(f.id, 'discofish', 'keep')]);
    assert.equal((await Candidate.findById(f.id)).resolution, 'kept');
  });
  await t.test('own reset racing partner vote never loses the partner decision', async () => {
    for (let i = 0; i < 8; i++) {
      const f = await fixture(); await vote(f.id, 'laserfox', 'keep');
      const results = await Promise.all([api(`/candidates/${f.id}/votes/mine`, 'DELETE', { player: 'laserfox' }), vote(f.id, 'discofish', 'keep')]);
      assert([200, 409].includes(results[0].status)); assert.equal(results[1].status, 200);
      const saved = await Candidate.findById(f.id); assert.equal(saved.votes.discofish.decision, 'keep');
      assert.equal(saved.deckState, saved.votes.laserfox.decision === 'pending' ? 'active' : 'resolved');
    }
  });
  await t.test('private notes stay player scoped in deck, history and duplicate nomination', async () => {
    const f = await fixture(); await vote(f.id, 'laserfox', 'keep', 'SECRET-LF');
    let partner = (await deck('discofish')).activeCandidates.find(c => c.id === f.id);
    assert.equal(partner.otherVote, 'hidden'); assert.equal(partner.notes, ''); assert(!JSON.stringify(partner).includes('SECRET-LF'));
    assert.equal((await deck('laserfox')).activeCandidates.find(c => c.id === f.id).notes, 'SECRET-LF');
    const nomination = await api('/candidates', 'POST', { itemId: String(f.item._id), nominatedBy: 'discofish' });
    assert(!JSON.stringify(nomination).includes('SECRET-LF'));
    await vote(f.id, 'discofish', 'toss', 'SECRET-DF');
    for (const player of ['laserfox', 'discofish']) {
      const history = await api(`/history?player=${player}&limit=50`); const c = history.candidates.find(c => c.id === f.id);
      assert.equal(c.notes, player === 'laserfox' ? 'SECRET-LF' : 'SECRET-DF');
      assert(!JSON.stringify(c).includes(player === 'laserfox' ? 'SECRET-DF' : 'SECRET-LF'));
    }
    const discussion = await api(`/candidates/${f.id}/resolve-discussion`, 'POST', { choice: 'keep', notes: 'SHARED resolution' });
    assert.equal(discussion.candidate.sharedNotes, 'SHARED resolution'); assert.equal(discussion.candidate.notes, '');
    assert(!JSON.stringify(discussion).includes('SECRET-'));
    const saved = await Candidate.findById(f.id); assert.equal(saved.privateNotes.laserfox, 'SECRET-LF'); assert.equal(saved.privateNotes.discofish, 'SECRET-DF');
  });
  await t.test('unattributed legacy notes remain stored and are not exposed as private drafts', async () => {
    const f = await fixture(); await Candidate.updateOne({ _id: f.id }, { $set: { notes: 'LEGACY-UNKNOWN-AUTHOR' } });
    await vote(f.id, 'laserfox', 'keep', 'NEW-LF');
    assert.equal((await Candidate.findById(f.id)).notes, 'LEGACY-UNKNOWN-AUTHOR');
    const c = (await deck('discofish')).activeCandidates.find(c => c.id === f.id);
    assert(!JSON.stringify(c).includes('LEGACY-UNKNOWN-AUTHOR')); assert.equal(c.notes, '');
  });
  await t.test('private notes can be edited without changing a vote and survive own reset', async () => {
    const f = await fixture(); await vote(f.id, 'laserfox', 'keep', 'draft1'); await vote(f.id, 'laserfox', 'keep', 'draft2');
    const reset = await api(`/candidates/${f.id}/votes/mine`, 'DELETE', { player: 'laserfox' });
    assert.equal(reset.candidate.notes, 'draft2'); assert.equal(reset.candidate.myVote, 'pending');
    assert.equal((await Candidate.findById(f.id)).privateNotes.laserfox, 'draft2');
  });
  await t.test('reopen Keep preserves nested box, compartment B and quantity', async () => {
    const f = await fixture({ quantity: 4 }); const parent = await Box.create({ box_id: 'QA-PARENT', label: 'QA parent' });
    const box = await complexBox(f.item); box.parentBox = parent._id; await box.save(); await agree(f, 'keep');
    assert.equal((await api(`/actions/${f.id}/reopen`, 'POST', { player: 'laserfox' })).status, 200);
    const after = await placedBox(f.item); assert.equal(String(after._id), String(box._id)); assert.equal(after.itemCompartments[String(f.item._id)], 'B');
    assert.equal((await Item.findById(f.item._id)).quantity, 4); assert.equal((await Candidate.findById(f.id)).deckState, 'active');
  });
  await t.test('release route conflict restores compartment B exactly', async () => {
    const f = await fixture(); const box = await complexBox(f.item); await agree(f, 'donate', 'sell'); assert.equal(await placedBox(f.item), null);
    const r = await api(`/actions/${f.id}/restore-keep`, 'POST', { player: 'laserfox' }); assert.equal(r.status, 200);
    const after = await placedBox(f.item); assert.equal(String(after._id), String(box._id)); assert.equal(after.itemCompartments[String(f.item._id)], 'B');
  });
  await t.test('new round snapshots current placement, not the previous round', async () => {
    const f = await fixture(); await complexBox(f.item); await agree(f, 'donate', 'sell');
    await api(`/actions/${f.id}/reopen`, 'POST', { player: 'laserfox' });
    const second = await Box.create({ box_id: 'QA-SECOND-ROUND', label: 'QA second destination' });
    await require('../backend/services/boxItemService').attachItemToBox({ itemId: f.item._id, boxId: second._id });
    await agree(f, 'donate', 'sell'); await api(`/actions/${f.id}/restore-keep`, 'POST', { player: 'laserfox' });
    assert.equal(String((await placedBox(f.item))._id), String(second._id));
  });
  await t.test('originally unboxed releases return unboxed after staging and restore', async () => {
    const f = await fixture(); await agree(f, 'donate'); const stage = await Box.create({ box_id: 'QA-STAGE', label: 'QA donations', declutterPurpose: 'donation_staging' });
    await api(`/actions/${f.id}/reroute`, 'POST', { player: 'laserfox', route: 'donate', boxId: String(stage._id) }); assert(await placedBox(f.item));
    await api(`/actions/${f.id}/restore-keep`, 'POST', { player: 'laserfox' }); assert.equal(await placedBox(f.item), null);
  });
  await t.test('action replies never expose private note maps or archived private notes', async () => {
    const f = await fixture(); await vote(f.id, 'laserfox', 'donate', 'ACTION-LF-SECRET'); await vote(f.id, 'discofish', 'donate', 'ACTION-DF-SECRET');
    const r = await api(`/actions/${f.id}/reopen`, 'POST', { player: 'laserfox' }); assert.equal(r.status, 200);
    assert(!JSON.stringify(r).includes('SECRET')); assert(!('privateNotes' in r.candidate)); assert(!('roundHistory' in r.candidate));
    const c = await Candidate.findById(f.id); assert.equal(c.privateNotes.laserfox, ''); assert.equal(c.roundHistory[0].privateNotes.laserfox, 'ACTION-LF-SECRET');
  });
  await t.test('retained gift intent and quantity behavior remain unchanged', async () => {
    const f = await fixture({ quantity: 3 }); await agree(f, 'gift'); await api(`/actions/${f.id}/restore-keep`, 'POST', { player: 'discofish' });
    const item = await Item.findById(f.item._id); assert.equal(item.isIntendedGift, true); assert.equal(item.quantity, 3); assert.equal(item.item_status, 'active');
  });
  await t.test('fresh connection retains each private note and committed votes', async () => {
    const f = await fixture(); await vote(f.id, 'laserfox', 'keep', 'PERSIST-LF'); await vote(f.id, 'discofish', 'keep', 'PERSIST-DF');
    await mongoose.disconnect(); await mongoose.connect(uri);
    const c = await Candidate.findById(f.id); assert.equal(c.resolution, 'kept'); assert.equal(c.privateNotes.laserfox, 'PERSIST-LF'); assert.equal(c.privateNotes.discofish, 'PERSIST-DF');
  });
  await t.test('only synthetic records exist and none were permanently deleted', async () => {
    assert.equal(await Item.countDocuments(), sequence); assert.equal(await Candidate.countDocuments(), sequence);
    assert.equal(await Item.countDocuments({ name: { $not: /^QA-DECLUTTER-/ } }), 0);
  });
});
