const {
  getBoxByMongoId,
  getBoxByBoxId,
  createBox,
  getBoxesByParent,
  updateBox,
  getBoxTree,
  getBoxTreeByBoxId,
  getAllBoxes,
  getBoxesExcludingId,
  deleteBox,
  deleteAllBoxes,
} = require('../services/boxService');

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

// GET /api/boxes/by-box-id/:box_id
const getBoxByBoxIdApi = async (req, res) => {
  const { box_id } = req.params;
  try {
    const box = await getBoxByBoxId(box_id);
    if (!box) {
      return res.status(404).json({ message: 'Box not found (custom box_id)' });
    }
    return res.status(200).json(box);
  } catch (err) {
    console.error('❌ Error fetching box by box_id:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

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
    const box = await getBoxByBoxId(short_id);
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

async function getBoxTreeByBoxIdApi(req, res) {
  try {
    const tree = await getBoxTreeByBoxId(req.params.box_id);
    if (!tree) {
      return res.status(404).json({ error: 'Box not found' });
    }
    res.json(tree);
  } catch (err) {
    console.error('❌ Failed to fetch box tree:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteBoxApi(req, res) {
  try {
    const deleted = await deleteBox(req.params.id);
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
  getBoxByMongoIdApi,
  getBoxByBoxIdApi,
  getAllBoxesApi,
  getBoxesExcludingApi,
  getBoxesByParentApi,
  checkBoxIdAvailability,
  createBoxApi,
  updateBoxApi,
  getBoxTreeApi,
  getBoxTreeByBoxIdApi,
  deleteBoxApi,
  deleteAllBoxesApi,
};
