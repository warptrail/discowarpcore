import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTreeGridEntries, getTreeNodeKey, getNestedTrayId } from '../frontend/src/components/OperationsInventory/operationsTreeLayout.js';

const nodes = Array.from({ length: 8 }, (_, index) => ({
  _id: `box-${index}`, box_id: String(index).padStart(3, '0'), childBoxes: [{ _id: `child-${index}` }],
}));
const labels = (entries) => entries.map(({ kind, node }) => `${kind}:${node.box_id}`);

test('expanded parents wait until their row is complete, including the leading Adrift tile', () => {
  const entries = buildTreeGridEntries(nodes, 5, (node) => ['000', '002'].includes(node.box_id), 1);
  assert.deepEqual(labels(entries), [
    'box:000', 'box:001', 'box:002', 'box:003', 'tray:000', 'tray:002',
    'box:004', 'box:005', 'box:006', 'box:007',
  ]);
});

test('partial final rows receive their trays after their final card', () => {
  assert.deepEqual(labels(buildTreeGridEntries(nodes.slice(0, 3), 7, () => true)), [
    'box:000', 'box:001', 'box:002', 'tray:000', 'tray:001', 'tray:002',
  ]);
});

test('resizing retains every card, tray and sibling order across desktop column counts', () => {
  for (const columns of [1, 2, 3, 4, 5, 6, 7, 9, 10]) {
    for (const leading of [0, 1]) {
      const entries = buildTreeGridEntries(nodes, columns, () => true, leading);
      assert.deepEqual(entries.filter((entry) => entry.kind === 'box').map((entry) => entry.node), nodes);
      assert.deepEqual(entries.filter((entry) => entry.kind === 'tray').map((entry) => entry.node), nodes);
      for (const node of nodes) {
        const index = nodes.indexOf(node);
        const rowEnd = Math.min(nodes.length - 1, index + columns - 1 - ((leading + index) % columns));
        assert(entries.findIndex((entry) => entry.kind === 'tray' && entry.node === node)
          > entries.findIndex((entry) => entry.kind === 'box' && entry.node === nodes[rowEnd]));
      }
    }
  }
});

test('leaves never create empty trays, and node identities do not depend on position or depth', () => {
  const leaf = { _id: 'physical-id', box_id: '001', childBoxes: [] };
  assert.deepEqual(labels(buildTreeGridEntries([leaf], 3, () => true)), ['box:001']);
  assert.equal(getTreeNodeKey(leaf), getTreeNodeKey({ ...leaf, depth: 9 }));
  assert.equal(getNestedTrayId(leaf), getNestedTrayId({ ...leaf, label: 'Renamed' }));
  assert.deepEqual(buildTreeGridEntries([], 1, () => true), []);
});
