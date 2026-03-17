const { BOX_MEDIA_SUBDIRS } = require('../config/media');
const { createSingleImageUpload } = require('./imageUploadFactory');

const { middleware: uploadSingleBoxImage, maxFileSizeBytes: MAX_FILE_SIZE_BYTES } =
  createSingleImageUpload({
    destinationSubdir: BOX_MEDIA_SUBDIRS.original,
  });

module.exports = {
  uploadSingleBoxImage,
  MAX_FILE_SIZE_BYTES,
};
