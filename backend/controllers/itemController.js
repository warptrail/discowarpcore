// controllers/itemController.js
const {
  getAllItems,
  getItemsPage,
  toItemStatusScope,
  getItemById,
  getOrphanedItems,
  getOrphanedItemsPage,
  createItem,
  updateItem,
  setItemImage,
  clearItemImage,
  hardDeleteItem,
  markItemGone,
  restoreItemToActive,
  backfillOrphanedTimestamps,
} = require('../services/itemService');
const { processItemImageUpload } = require('../services/itemImageService');
const { collectImageStoragePaths } = require('../services/imageMetadataService');
const {
  safeDeleteMediaFile,
  safeDeleteMediaFiles,
} = require('../utils/mediaCleanup');

function parsePositiveInt(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function parseNonNegativeInt(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

async function getAllItemsApi(req, res) {
  try {
    const statusScope = toItemStatusScope(req.query.status);
    const hasPaginationRequest =
      req.query.limit != null || req.query.offset != null || req.query.page != null;
    const hasFilterRequest =
      String(req.query.q ?? req.query.search ?? '').trim() ||
      String(req.query.category ?? '').trim() ||
      String(req.query.tag ?? '').trim() ||
      String(req.query.sort ?? '').trim();

    if (hasPaginationRequest || hasFilterRequest) {
      const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
      const page = parsePositiveInt(req.query.page, 1);
      const offsetFromPage = (page - 1) * limit;
      const offset = parseNonNegativeInt(req.query.offset, offsetFromPage);

      const payload = await getItemsPage({
        statusScope,
        limit,
        offset,
        query: req.query.q ?? req.query.search ?? '',
        category: req.query.category ?? '',
        tag: req.query.tag ?? '',
        sort: req.query.sort ?? 'alphabetical',
      });

      return res.json(payload);
    }

    const items = await getAllItems({ statusScope });
    return res.json(items);
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
  const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
  const page = parsePositiveInt(req.query.page, 1);
  const offsetFromPage = (page - 1) * limit;
  const offset = parseNonNegativeInt(req.query.offset, offsetFromPage);
  const wantsPagination =
    req.query.offset != null ||
    req.query.page != null ||
    String(req.query.paginated || '').trim() === '1';

  try {
    if (wantsPagination) {
      const payload = await getOrphanedItemsPage({ sort, limit, offset });
      return res.json(payload);
    }

    const items = await getOrphanedItems(sort, limit);
    return res.json(items);
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
      await safeDeleteMediaFiles(filesToCleanup, {
        label: `item-image-upload-not-found:${id}`,
      });
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
      await safeDeleteMediaFiles(filesToCleanup, {
        label: 'item-image-upload-failed',
      });
    } else if (req?.file?.path) {
      await safeDeleteMediaFile(req.file.path, {
        label: 'item-image-upload-failed',
      });
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

    const updated = await clearItemImage(id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Item not found' });
    }

    await safeDeleteMediaFiles(storagePaths, { label: `item-image-clear:${id}` });

    return res.status(200).json({
      ok: true,
      itemId: updated._id,
      image: updated.image,
      deletedFileCount: storagePaths.length,
    });
  } catch (err) {
    console.error('❌ Error deleting item image:', err);
    return res.status(400).json({ ok: false, error: 'Failed to delete item image' });
  }
}

async function deleteItemById(req, res) {
  try {
    const deleted = await hardDeleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ ok: true, message: 'Item permanently deleted' });
  } catch (err) {
    console.error('❌ Error deleting item:', err);
    res.status(400).json({ error: 'Failed to permanently delete item' });
  }
}

async function markItemGoneApi(req, res) {
  try {
    const updated = await markItemGone(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ ok: false, error: 'Item not found' });

    const enriched = await getItemById(req.params.id);
    return res.status(200).json({ ok: true, data: enriched || updated });
  } catch (err) {
    console.error('❌ Error marking item gone:', err);
    return res.status(err?.status || 400).json({
      ok: false,
      error: err?.message || 'Failed to mark item gone',
    });
  }
}

async function restoreItemToActiveApi(req, res) {
  try {
    const updated = await restoreItemToActive(req.params.id);
    if (!updated) return res.status(404).json({ ok: false, error: 'Item not found' });

    const enriched = await getItemById(req.params.id);
    return res.status(200).json({ ok: true, data: enriched || updated });
  } catch (err) {
    console.error('❌ Error restoring item to active:', err);
    return res.status(err?.status || 400).json({
      ok: false,
      error: err?.message || 'Failed to restore item to active',
    });
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
  markItemGoneApi,
  restoreItemToActiveApi,
  backfillOrphanedTimestampsApi,
};
