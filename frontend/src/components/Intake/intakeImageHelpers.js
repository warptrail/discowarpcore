import { uploadBoxImage, removeBoxImage } from '../../api/boxes';
import { removeItemImage, uploadItemImage } from '../../api/itemMedia';
import { cropImageToSquare } from '../../util/cropImageToSquare';

export function pickImageUrl(entity) {
  return (
    entity?.image?.display?.url ||
    entity?.image?.thumb?.url ||
    entity?.image?.original?.url ||
    entity?.image?.url ||
    entity?.imagePath ||
    ''
  );
}

export async function uploadCroppedBoxImage(boxMongoId, file) {
  if (!boxMongoId) throw new Error('boxMongoId is required');
  if (!file) throw new Error('file is required');

  const processedFile = await cropImageToSquare(file, { maxDimension: 1200 });
  return uploadBoxImage(boxMongoId, processedFile);
}

export async function removeExistingBoxImage(boxMongoId) {
  if (!boxMongoId) throw new Error('boxMongoId is required');
  return removeBoxImage(boxMongoId);
}

export async function uploadCroppedItemImage(itemId, file) {
  if (!itemId) throw new Error('itemId is required');
  if (!file) throw new Error('file is required');

  const processedFile = await cropImageToSquare(file, { maxDimension: 1200 });
  return uploadItemImage(itemId, processedFile);
}

export async function removeExistingItemImage(itemId) {
  if (!itemId) throw new Error('itemId is required');
  return removeItemImage(itemId);
}
