const assert = require('node:assert/strict');
const fs = require('node:fs');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');

const apiOrigin = 'http://127.0.0.1:7610';
const origin = 'http://127.0.0.1:7611';
const checks = [];
async function api(path, { method = 'GET', body, status = 200 } = {}) {
  const response = await fetch(`${apiOrigin}/api${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const value = await response.json();
  assert.equal(response.status, status, JSON.stringify(value));
  return value;
}
async function clickText(page, text) {
  const button = await page.evaluateHandle((label) => [...document.querySelectorAll('button, summary')].find((element) => element.innerText.trim() === label), text);
  assert.ok(button.asElement(), `Missing control: ${text}`);
  await button.asElement().click();
  await button.dispose();
}
(async () => {
  const env = require('dotenv').parse(fs.readFileSync('backend/.env'));
  assert.match(env.MONGO_URI || '', /^mongodb:\/\/(?:127\.0\.0\.1|localhost):27017\/discowarpcore_dev(?:\?|$)/);
  await mongoose.connect(env.MONGO_URI);
  const Box = require('../../backend/models/Box');
  const Item = require('../../backend/models/Item');
  const { EventLog } = require('../../backend/models/EventLog');
  const testBoxes = [], testItems = [];
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const allBoxes = await api('/boxes');
    const fixtures = allBoxes.filter((box) => box.tags?.includes('mock-complex-box-v1'));
    assert.equal(fixtures.length, 3);
    assert.equal(fixtures.reduce((sum, box) => sum + box.items.length, 0), 28);
    const kitchen = fixtures.find((box) => box.tags.includes('mock-complex-box-v1-kitchen'));
    for (const width of [1280, 430, 320]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(`${origin}/boxes/${kitchen.box_id}B2`, { waitUntil: 'networkidle0' });
      assert.equal(new URL(page.url()).searchParams.get('compartment'), 'B2');
      const text = await page.$eval('body', (body) => body.innerText);
      assert.ok(text.includes('[MOCK] Dinner plate'));
      assert.ok(!text.includes('[MOCK] Mug'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
      await page.screenshot({ path: `/tmp/complex-kitchen-${width}.png`, fullPage: true });
      await page.click(`[aria-label="Browse ${kitchen.box_id}B: Cabinet B"]`);
      await page.waitForFunction(() => new URL(location.href).searchParams.get('compartment') === 'B');
      await page.waitForFunction(() => document.body.innerText.includes('[MOCK] Mug'));
      const grouped = await page.$eval('body', (body) => body.innerText);
      for (const name of ['Mug', 'Dinner plate', 'Cereal bowl']) assert.ok(grouped.includes(`[MOCK] ${name}`));
      checks.push({ width, shelfRoute: true, cabinetAggregation: true, overflow: false });
    }
    const ids = Array.from({ length: 100 }, (_, i) => String(900 + i)).filter((id) => !allBoxes.some((box) => box.box_id === id));
    assert.ok(ids.length >= 2);
    const source = await api('/boxes', { method: 'POST', status: 201, body: { box_id: ids[0], label: '[DISPOSABLE QA] Complex', isComplexBox: true, tags: ['complex-compartment-disposable-qa'] } });
    testBoxes.push(source._id);
    const child = await api('/boxes', { method: 'POST', status: 201, body: { box_id: ids[1], label: '[DISPOSABLE QA] Jewelry box', parentBox: source._id, parentCompartmentKey: 'A', tags: ['complex-compartment-disposable-qa'] } });
    testBoxes.push(child._id);
    const made = await api(`/boxed-items/boxes/${source._id}/items`, { method: 'POST', status: 201, body: { name: '[DISPOSABLE QA] Sample', compartmentKey: 'A' } });
    const sample = made.item || made;
    assert.ok(sample._id, JSON.stringify(made));
    testItems.push(sample._id);
    // Backend rejection must leave existing structure and assignments unchanged.
    const before = await Box.findById(source._id).lean();
    const split = [{ key: 'A', label: 'Cabinet', children: [{ key: 'A1', label: 'Shelf' }] }, { key: 'B', label: '' }];
    await api(`/boxes/${source._id}`, { method: 'PATCH', status: 400, body: { compartments: split } });
    assert.deepEqual(await Box.findById(source._id).lean(), before);
    const depth4 = structuredClone(split); depth4[0].children[0].children = [{ key: 'A1a' }];
    await api(`/boxes/${source._id}`, { method: 'PATCH', status: 400, body: { compartments: depth4 } });
    await page.setViewport({ width: 430, height: 900 });
    await page.goto(`${origin}/boxes/${source.box_id}`, { waitUntil: 'networkidle0' });
    await clickText(page, 'Name or add compartments and shelves');
    await clickText(page, 'Subdivide A into shelves');
    assert.equal(await page.$('button[aria-label="Subdivide A1 into shelves"]'), null);
    await page.select('[aria-label="Shelf for [DISPOSABLE QA] Sample"]', 'A1');
    await page.select('[aria-label="Shelf for [DISPOSABLE QA] Jewelry box"]', 'A1');
    const saveResponse = page.waitForResponse((response) => response.url().endsWith(`/api/boxes/${source._id}`) && response.request().method() === 'PATCH');
    await clickText(page, 'Save compartments');
    assert.equal((await saveResponse).status(), 200);
    await page.waitForFunction((address) => document.body.innerText.includes(address), {}, `#${source.box_id}A1`);
    const after = await Box.findById(source._id).lean();
    assert.equal(after.itemCompartments[sample._id], 'A1');
    assert.equal(after.childBoxCompartments[child._id], 'A1');
    checks.push({ occupiedSubdivisionViaUI: true, fourthLayerRejectedViaAPI: true, incompleteUpdateAtomic: true });
    // Same-parent placement and exact Undo are accepted through the public API.
    await api(`/boxes/${child._id}`, { method: 'PATCH', body: { parentBox: source._id, parentCompartmentKey: 'B' } });
    await api(`/boxes/${child._id}`, { method: 'PATCH', body: { parentBox: source._id, parentCompartmentKey: 'A1' } });
    const resolved = await api(`/boxes/by-mongo-id/${child._id}`);
    assert.equal((resolved.box || resolved).parentCompartmentKey, 'A1');
    await page.goto(`${origin}/boxes/${child.box_id}?tab=edit&panel=nest`, { waitUntil: 'networkidle0' });
    const destination = `[title="Nest into [DISPOSABLE QA] Complex (#${source.box_id}B)"]`;
    await page.waitForSelector(destination);
    const moveResponse = page.waitForResponse((response) => response.url().endsWith(`/api/boxes/${child._id}`) && response.request().method() === 'PATCH');
    await page.click(destination);
    assert.equal((await moveResponse).status(), 200);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((button) => button.innerText === 'Undo'));
    assert.equal((await api(`/boxes/by-mongo-id/${child._id}`)).parentCompartmentKey, 'B');
    const undoResponse = page.waitForResponse((response) => response.url().endsWith(`/api/boxes/${child._id}`) && response.request().method() === 'PATCH');
    await clickText(page, 'Undo');
    assert.equal((await undoResponse).status(), 200);
    assert.equal((await api(`/boxes/by-mongo-id/${child._id}`)).parentCompartmentKey, 'A1');
    assert.deepEqual(errors, []);
    checks.push({ physicalShelfMoveAndUndo: true, nestingPickerAndHeaderUndo: true, browserErrors: 0 });
    console.log(JSON.stringify({ fixtures: fixtures.map((box) => box.box_id), checks }, null, 2));
  } finally {
    await browser.close();
    // Delete only explicitly created disposable records, even when a browser assertion fails.
    if (testBoxes.length) {
      const placed = await Box.find({ _id: { $in: testBoxes } }).select('items').lean();
      const ownItems = [...new Set([...testItems, ...placed.flatMap((box) => box.items.map(String))])];
      await Item.deleteMany({ _id: { $in: ownItems } });
      await Box.deleteMany({ _id: { $in: testBoxes }, tags: 'complex-compartment-disposable-qa' });
      await EventLog.deleteMany({ entity_id: { $in: [...testBoxes, ...ownItems] } });
    }
    await mongoose.disconnect();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
