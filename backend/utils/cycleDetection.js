// utils/cycleDetection.js

const Box = require('../models/boxModel');

/**
 * Checks if setting a box's parent would create a cycle.
 *
 * Example: If Box A contains Box B, then Box B should not be set to contain Box A (directly or indirectly).
 * This function walks up the ancestry chain of the proposed new parent to make sure it doesn't include the box being moved.
 *
 * @param {string} boxIdBeingMoved - the box you're trying to move (e.g., Box B)
 * @param {string|null} newParentId - the box you want to make the new parent (e.g., Box A)
 * @returns true if the move would create a cycle, false otherwise
 */
async function isCyclicRelationship(boxIdBeingMoved, newParentId) {
  // If there's no parent, there's no possibility of a cycle.
  if (!newParentId) return false;

  // Start at the proposed new parent
  let currentBox = await Box.findById(newParentId).lean();

  // Walk up the tree to see if we ever reach the box we're trying to move
  while (currentBox) {
    // If we reach the same ID as the box being moved, it's a cycle
    if (currentBox._id.toString() === boxIdBeingMoved.toString()) {
      return true;
    }

    // Move one level up
    if (!currentBox.parentBox) break;
    currentBox = await Box.findById(currentBox.parentBox).lean();
  }

  // No cycle found
  return false;
}

module.exports = { isCyclicRelationship };
