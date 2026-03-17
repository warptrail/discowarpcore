// controllers/itemController.js
const fs = require('fs/promises');
const {
  getAllItems,
  getItemById,
  getOrphanedItems,
  createItem,
  updateItem,
  setItemImage,
  clearItemImage,
  deleteItem,
  backfillOrphanedTimestamps,
} = require('../services/itemService');
const { processItemImageUpload } = require('../services/itemImageService');
const { toAbsoluteMediaPath } = require('../config/media');
const { collectImageStoragePaths } = require('../services/imageMetadataService');

async function getAllItemsApi(req, res) {
  try {
    const items = await getAllItems();
    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching items:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}

async function getItemByIdApi(req, res) {
  try {
    const { id } = req.params;
    // optional: allow ?select= to trim fields, else return full doc
    const select = req.query.select
      ? req.query.select
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(' ')
      : undefined;

    const data = await getItemById(id, { select });

    if (!data)
      return res.status(404).json({ ok: false, error: 'Item not found' });
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('❌ getItemByIdApi:', err);
    return res.status(400).json({ ok: false, error: 'Bad request' });
  }
}

// (others unchanged)
async function getOrphanedItemsApi(req, res) {
  const sort = req.query.sort || 'recent';
  const limit = parseInt(req.query.limit) || 20;

  try {
    const items = await getOrphanedItems(sort, limit);
    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching orphaned items:', err);
    res.status(500).json({ error: 'Failed to fetch orphaned items' });
  }
}

async function postItem(req, res) {
  try {
    const newItem = await createItem(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    console.error('❌ Error creating item:', err);
    res.status(400).json({ error: 'Failed to create item' });
  }
}

async function patchItem(req, res) {
  try {
    const { id } = req.params;

    // Update the item
    const updated = await updateItem(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Re-fetch full enriched shape
    const refreshed = await getItemById(id);
    if (!refreshed) {
      return res.status(404).json({ error: 'Item not found after update' });
    }

    res.json({ ok: true, data: refreshed });
  } catch (err) {
    console.error('❌ Error updating item:', err);
    res.status(400).json({ error: 'Failed to update item' });
  }
}

async function postItemImageApi(req, res) {
  let filesToCleanup = [];

  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ ok: false, error: 'No file uploaded. Expected form field "image".' });
    }

    const processed = await processItemImageUpload(file);
    const image = processed.image;
    filesToCleanup = processed.filesToCleanup;

    const updated = await setItemImage(id, image);
    if (!updated) {
      await Promise.all(filesToCleanup.map((target) => fs.unlink(target).catch(() => {})));
      return res.status(404).json({ ok: false, error: 'Item not found' });
    }

    return res.status(201).json({
      ok: true,
      itemId: updated._id,
      image: updated.image,
      urls: {
        display: updated.image?.display?.url || null,
        thumb: updated.image?.thumb?.url || null,
        original: updated.image?.original?.url || null,
      },
    });
  } catch (err) {
    console.error('❌ Error uploading item image:', err);
    if (filesToCleanup.length) {
      await Promise.all(filesToCleanup.map((target) => fs.unlink(target).catch(() => {})));
    } else if (req?.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    return res.status(400).json({ ok: false, error: 'Failed to upload item image' });
  }
}

async function deleteItemImageApi(req, res) {
  try {
    const { id } = req.params;
    const current = await getItemById(id);

    if (!current) {
      return res.status(404).json({ ok: false, error: 'Item not found' });
    }

    const storagePaths = collectImageStoragePaths(current);
    const absolutePaths = storagePaths.map((relativePath) =>
      toAbsoluteMediaPath(relativePath)
    );

    const updated = await clearItemImage(id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Item not found' });
    }

    await Promise.all(
      absolutePaths.map(async (target) => {
        try {
          await fs.unlink(target);
        } catch (err) {
          if (err?.code !== 'ENOENT') {
            console.warn(`[item-image] failed to delete file: ${target}`, err);
          }
        }
      })
    );

    return res.status(200).json({
      ok: true,
      itemId: updated._id,
      image: updated.image,
      deletedFileCount: absolutePaths.length,
    });
  } catch (err) {
    console.error('❌ Error deleting item image:', err);
    return res.status(400).json({ ok: false, error: 'Failed to delete item image' });
  }
}

async function deleteItemById(req, res) {
  try {
    const deleted = await deleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('❌ Error deleting item:', err);
    res.status(400).json({ error: 'Failed to delete item' });
  }
}

async function backfillOrphanedTimestampsApi(req, res) {
  try {
    const updatedCount = await backfillOrphanedTimestamps();
    res.json({ message: `✅ Updated ${updatedCount} orphaned items.` });
  } catch (err) {
    console.error('❌ Error in backfill controller:', err);
    res.status(500).json({ error: 'Backfill failed' });
  }
}

module.exports = {
  getAllItemsApi,
  getItemByIdApi,
  getOrphanedItemsApi,
  postItem,
  patchItem,
  postItemImageApi,
  deleteItemImageApi,
  deleteItemById,
  backfillOrphanedTimestampsApi,
};
