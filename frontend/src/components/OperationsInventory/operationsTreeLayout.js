// Identity and ancestry belong to the tree, independently of card presentation.
// Compartments can later supply their own node identity without becoming boxes.
export const getTreeNodeKey = (node) => String(node?._id || node?.box_id || '');
export const getNestedTrayId = (node) => `operations-nested-tray-${encodeURIComponent(getTreeNodeKey(node))}`;
export const getNestedToggleId = (node) => `operations-nested-toggle-${encodeURIComponent(getTreeNodeKey(node))}`;

export function buildTreeGridEntries(nodes, columns, isExpanded, leadingCount = 0) {
  const columnCount = Math.max(1, columns);
  const entries = [];
  let rowTrays = [];

  nodes.forEach((node, index) => {
    entries.push({ kind: 'box', node });
    if (node.childBoxes?.length && isExpanded(node)) rowTrays.push({ kind: 'tray', node });

    const rowComplete = (leadingCount + index + 1) % columnCount === 0;
    if (rowComplete || index === nodes.length - 1) {
      entries.push(...rowTrays);
      rowTrays = [];
    }
  });
  return entries;
}
