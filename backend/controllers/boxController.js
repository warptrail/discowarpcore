const {
  getBoxByMongoId,
  getBoxByShortId,
  createBox,
  getBoxesByParent,
  updateBox,
  getBoxTree,
  getBoxTreeByShortId,
  getAllBoxes,
  getBoxesExcludingId,
  deleteBoxById,
  deleteAllBoxes,
  getBoxDataStructure,
} = require('../services/boxService');

async function getBoxDataStructureApi(req, res, next) {
  try {
    const { shortId } = req.params;
    const includeAncestors = req.query.ancestors === '1';
    const includeStats = req.query.stats !== '0'; // default on
    const flat =
      req.query.flat === 'items' || req.query.flat === 'all'
        ? req.query.flat
        : 'none';

    const box = await getBoxDataStructure(shortId, {
      includeAncestors,
      includeStats,
      flat,
    });

    if (!box)
      return res.status(404).json({ ok: false, error: 'Box not found' });
    res.json({ ok: true, box });
  } catch (err) {
    next(err);
  }
}

// GET /api/boxes/by-mongo-id/:id
const getBoxByMongoIdApi = async (req, res) => {
  const { id } = req.params;
  try {
    const box = await getBoxByMongoId(id);
    if (!box) {
      return res.status(404).json({ message: 'Box not found (MongoDB ID)' });
    }
    return res.status(200).json(box);
  } catch (err) {
    console.error('❌ Error fetching box by Mongo _id:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

async function getBoxByShortIdApi(req, res) {
  try {
    // accept either param name (shortId is canonical; boxId kept for back-compat)
    const shortId = req.params.shortId ?? req.params.boxId;
    const box = await getBoxByShortId(shortId);
    if (!box)
      return res.status(404).json({ ok: false, error: 'Box not found' });
    res.json({ ok: true, box });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

async function getBoxTreeByShortIdApi(req, res) {
  try {
    // accept either param name (shortId is canonical; boxId kept for back-compat)
    const shortId = req.params.shortId ?? req.params.boxId;
    const box = await getBoxTreeByShortId(shortId);
    if (!box)
      return res.status(404).json({ ok: false, error: 'Box not found' });
    res.json({ ok: true, box });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

async function getAllBoxesApi(req, res) {
  try {
    const boxes = await getAllBoxes();
    res.json(boxes);
  } catch (err) {
    console.error('❌ Error fetching all boxes:', err);
    res.status(500).json({ error: 'Failed to get all boxes' });
  }
}

async function getBoxesExcludingApi(req, res) {
  const { id } = req.params;

  try {
    const boxes = await getBoxesExcludingId(id);
    res.json(boxes);
  } catch (err) {
    console.error('❌ Error in getBoxesExcluding:', err);
    res.status(500).json({ error: 'Failed to fetch boxes' });
  }
}

async function getBoxesByParentApi(req, res) {
  try {
    const { parent } = req.query;
    const boxes = await getBoxesByParent(parent);
    res.json(boxes);
  } catch (err) {
    console.error('❌ Failed to fetch boxes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function checkBoxIdAvailability(req, res) {
  const { short_id } = req.params;

  // Validate format: must be exactly 3 digits
  const isValidFormat = /^\d{3}$/.test(short_id);

  if (!isValidFormat) {
    return res.status(400).json({
      error: 'Invalid box_id format. Must be a 3-digit number like "001".',
    });
  }

  try {
    const box = await getBoxByShortId(short_id);
    return res.json({ available: !box });
  } catch (err) {
    console.error('Error checking box Id availability:', err);
    return res.status(500).json({ error: 'Internal server error :<' });
  }
}

async function createBoxApi(req, res) {
  const { box_id, label, parentBox, items } = req.body;

  // 👇 you can now safely use box_id
  const isValidFormat = /^\d{3}$/.test(box_id);
  if (!isValidFormat) {
    return res.status(400).json({
      error: 'Invalid box_id format. Must be a 3-digit number like "001".',
    });
  }

  try {
    const newBox = await createBox({ box_id, label, parentBox, items });
    res.status(201).json(newBox);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.box_id) {
      return res.status(400).json({ error: 'Box ID is already in use' });
    }

    console.error('❌ Box creation error:', err);
    res.status(500).json({ error: 'Failed to create box' });
  }
}

async function updateBoxApi(req, res) {
  try {
    const updated = await updateBox(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Box not found' });
    }
    res.json(updated);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.box_id) {
      return res.status(400).json({ error: 'Box ID is already in use' });
    }

    console.error('❌ Error updating box:', err);
    res.status(400).json({ error: 'Failed to update box' });
  }
}

async function getBoxTreeApi(req, res) {
  try {
    const tree = await getBoxTree();
    return res.status(200).json(tree);
  } catch (err) {
    console.error('❌ Error in getBoxTreeController:', err);
    res.status(500).json({ error: 'Failed to build box tree' });
  }
}

async function getBoxTreeByShortIdApi(req, res) {
  try {
    const tree = await getBoxTreeByShortId(req.params.shortId);
    if (!tree) {
      return res.status(404).json({ error: 'Box not found' });
    }
    res.json(tree);
  } catch (err) {
    console.error('❌ Failed to fetch box tree:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteBoxByIdApi(req, res) {
  try {
    const deleted = await deleteBoxById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Box not found' });
    }
    res.json({
      message: 'Box deleted and child boxes reparented to top level',
    });
  } catch (err) {
    console.error('❌ Error deleting box:', err);
    res.status(400).json({ error: 'Failed to delete box' });
  }
}

async function deleteAllBoxesApi(req, res) {
  try {
    const deletedCount = await deleteAllBoxes();
    res
      .status(200)
      .json({ message: `Deleted ${deletedCount} boxes. All items orphaned.` });
  } catch (err) {
    console.error('Error deleting all boxes:', err);
    res.status(500).json({ error: 'Failed to delete all boxes' });
  }
}

module.exports = {
  getBoxDataStructureApi,
  getBoxByMongoIdApi,
  getBoxByShortIdApi,
  getAllBoxesApi,
  getBoxesExcludingApi,
  getBoxesByParentApi,
  checkBoxIdAvailability,
  createBoxApi,
  updateBoxApi,
  getBoxTreeApi,
  getBoxTreeByShortIdApi,
  deleteBoxByIdApi,
  deleteAllBoxesApi,
};
