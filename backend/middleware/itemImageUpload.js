const { ITEM_MEDIA_SUBDIRS } = require('../config/media');
const { createSingleImageUpload } = require('./imageUploadFactory');

const { middleware: uploadSingleItemImage, maxFileSizeBytes: MAX_FILE_SIZE_BYTES } =
  createSingleImageUpload({
    destinationSubdir: ITEM_MEDIA_SUBDIRS.original,
  });

module.exports = {
  uploadSingleItemImage,
  MAX_FILE_SIZE_BYTES,
};
