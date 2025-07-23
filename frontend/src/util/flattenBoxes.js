// This function takes a nested box structure and flattens all items inside it,
// including items in any childBoxes (nested recursively).
// It returns a flat array of all items, each annotated with which box they came from.

export default function flattenBoxes(box, parentLabel = null) {
  // Initialize an empty array to collect all flattened items
  let flatItems = [];

  // Check if the current box has any items
  if (box.items && Array.isArray(box.items)) {
    // Annotate each item with its parent box label and ID for context
    const labeledItems = box.items.map((item) => ({
      ...item, // copy all original item properties
      parentBoxLabel: box.label || parentLabel || 'Unlabeled Box', // fallback if label is missing
      parentBoxId: box.box_id || '???', // fallback ID if missing
    }));

    // Add the labeled items to our flatItems array
    flatItems.push(...labeledItems);
  }

  // Now handle any child boxes recursively
  if (box.childBoxes && Array.isArray(box.childBoxes)) {
    // Loop over each child box
    box.childBoxes.forEach((childBox) => {
      // Recursively flatten that child box's items too
      const childItems = flattenBoxes(
        childBox,
        childBox.label || box.label // pass down the label in case the child is missing one
      );

      // Add the flattened child items to our master flatItems array
      flatItems.push(...childItems);
    });
  }

  // Return the final flattened array of items with box context included
  return flatItems;
}
