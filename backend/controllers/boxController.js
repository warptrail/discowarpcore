const {
  getBoxByMongoId,
  getBoxByShortId,
  createBox,
  getBoxesByParent,
  updateBox,
  setBoxImage,
  clearBoxImage,
  getBoxTree,
  getBoxTreeByShortId,
  getAllBoxes,
  getBoxesExcludingId,
  deleteBoxById,
  deleteAllBoxes,
  getBoxDataStructure,
  releaseChildrenToFloor,
} = require('../services/boxService');
const { processBoxImageUpload } = require('../services/itemImageService');
const { collectImageStoragePaths } = require('../services/imageMetadataService');
const {
  safeDeleteMediaFile,
  safeDeleteMediaFiles,
} = require('../utils/mediaCleanup');

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
  const { box_id, label, parentBox, items, location, locationId, tags } = req.body;

  // 👇 you can now safely use box_id
  const isValidFormat = /^\d{3}$/.test(box_id);
  if (!isValidFormat) {
    return res.status(400).json({
      error: 'Invalid box_id format. Must be a 3-digit number like "001".',
    });
  }

  try {
    const newBox = await createBox({
      box_id,
      label,
      parentBox,
      items,
      location,
      locationId,
      tags,
    });
    res.status(201).json(newBox);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.box_id) {
      return res.status(400).json({ error: 'Box ID is already in use' });
    }

    if (err?.status) {
      return res
        .status(err.status)
        .json({ error: err.message || 'Failed to create box', code: err.code });
    }

    console.error('❌ Box creation error:', err);
    res.status(500).json({ error: 'Failed to create box' });
  }
}

async function updateBoxApi(req, res) {
  try {
    const updated = await updateBox(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: 'Box not found',
        code: 'BOX_NOT_FOUND',
      });
    }

    return res.status(200).json({ ok: true, box: updated });
  } catch (err) {
    // Duplicate box_id
    if (err.code === 11000 && err.keyPattern?.box_id) {
      return res.status(400).json({
        ok: false,
        error: 'Box ID is already in use',
        code: 'DUPLICATE_BOX_ID',
      });
    }

    // Invalid ObjectId (service-level)
    if (err.code === 'INVALID_OBJECT_ID') {
      return res.status(err.status || 400).json({
        ok: false,
        error: err.message || 'Invalid box id',
        code: err.code,
      });
    }

    // Not found (service-level)
    if (err.code === 'BOX_NOT_FOUND') {
      return res.status(err.status || 404).json({
        ok: false,
        error: err.message || 'Box not found',
        code: err.code,
      });
    }

    // Cycle prevention
    if (err.code === 'CYCLE_DETECTED') {
      return res.status(err.status || 409).json({
        ok: false,
        error: err.message,
        code: err.code,
      });
    }

    console.error('❌ Error updating box:', err);
    return res.status(err.status || 400).json({
      ok: false,
      error: err.message || 'Failed to update box',
    });
  }
}

async function postBoxImageApi(req, res) {
  let filesToCleanup = [];

  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ ok: false, error: 'No file uploaded. Expected form field "image".' });
    }

    const processed = await processBoxImageUpload(file);
    const image = processed.image;
    filesToCleanup = processed.filesToCleanup;

    const updated = await setBoxImage(id, image);
    if (!updated) {
      await safeDeleteMediaFiles(filesToCleanup, {
        label: `box-image-upload-not-found:${id}`,
      });
      return res.status(404).json({ ok: false, error: 'Box not found' });
    }

    return res.status(201).json({
      ok: true,
      boxId: updated._id,
      image: updated.image,
      urls: {
        display: updated.image?.display?.url || null,
        thumb: updated.image?.thumb?.url || null,
        original: updated.image?.original?.url || null,
      },
    });
  } catch (err) {
    console.error('❌ Error uploading box image:', err);
    if (filesToCleanup.length) {
      await safeDeleteMediaFiles(filesToCleanup, {
        label: 'box-image-upload-failed',
      });
    } else if (req?.file?.path) {
      await safeDeleteMediaFile(req.file.path, {
        label: 'box-image-upload-failed',
      });
    }
    return res.status(400).json({ ok: false, error: 'Failed to upload box image' });
  }
}

async function deleteBoxImageApi(req, res) {
  try {
    const { id } = req.params;
    const current = await getBoxByMongoId(id);

    if (!current) {
      return res.status(404).json({ ok: false, error: 'Box not found' });
    }

    const storagePaths = collectImageStoragePaths(current);

    const updated = await clearBoxImage(id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Box not found' });
    }

    await safeDeleteMediaFiles(storagePaths, { label: `box-image-clear:${id}` });

    return res.status(200).json({
      ok: true,
      boxId: updated._id,
      image: updated.image,
      deletedFileCount: storagePaths.length,
    });
  } catch (err) {
    console.error('❌ Error deleting box image:', err);
    return res.status(400).json({ ok: false, error: 'Failed to delete box image' });
  }
}

// POST /api/boxes/:id/release-children
async function releaseChildrenToFloorApi(req, res) {
  try {
    const { id } = req.params;
    const result = await releaseChildrenToFloor(id);

    return res.status(200).json({
      ok: true,
      message: 'Children released to floor',
      modifiedCount: result.modifiedCount ?? 0,
    });
  } catch (err) {
    console.error('❌ Error releasing children to floor:', err);

    if (err.code === 'INVALID_OBJECT_ID') {
      return res.status(err.status || 400).json({
        ok: false,
        error: err.message || 'Invalid box id',
        code: err.code,
      });
    }

    if (err.code === 'BOX_NOT_FOUND') {
      return res.status(err.status || 404).json({
        ok: false,
        error: err.message || 'Box not found',
        code: err.code,
      });
    }

    return res.status(err.status || 400).json({
      ok: false,
      error: err.message || 'Failed to release children',
    });
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
      message:
        'Box deleted; descendant boxes were released to floor level and direct items were orphaned.',
      ...deleted,
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
  postBoxImageApi,
  deleteBoxImageApi,
  releaseChildrenToFloorApi,
  getBoxTreeApi,
  getBoxTreeByShortIdApi,
  deleteBoxByIdApi,
  deleteAllBoxesApi,
};
