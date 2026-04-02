const MEDIA_ERROR_CODES = Object.freeze({
  MEDIA_INVALID_INPUT: 'MEDIA_INVALID_INPUT',
  MEDIA_SOURCE_NOT_FOUND: 'MEDIA_SOURCE_NOT_FOUND',
  MEDIA_PATH_OUT_OF_BOUNDS: 'MEDIA_PATH_OUT_OF_BOUNDS',
  OBJECT_GLOW_SPAWN_FAILED: 'OBJECT_GLOW_SPAWN_FAILED',
  OBJECT_GLOW_TIMEOUT: 'OBJECT_GLOW_TIMEOUT',
  OBJECT_GLOW_BAD_JSON: 'OBJECT_GLOW_BAD_JSON',
  OBJECT_GLOW_PROCESS_FAILED: 'OBJECT_GLOW_PROCESS_FAILED',
  MEDIA_OUTPUT_MISSING: 'MEDIA_OUTPUT_MISSING',
  MEDIA_DERIVATIVE_SYNC_FAILED: 'MEDIA_DERIVATIVE_SYNC_FAILED',
  MEDIA_JOB_NOT_FOUND: 'MEDIA_JOB_NOT_FOUND',
  MEDIA_JOB_QUEUE_FULL: 'MEDIA_JOB_QUEUE_FULL',
});

const HTTP_STATUS_BY_CODE = Object.freeze({
  [MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT]: 400,
  [MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND]: 404,
  [MEDIA_ERROR_CODES.MEDIA_PATH_OUT_OF_BOUNDS]: 400,
  [MEDIA_ERROR_CODES.OBJECT_GLOW_SPAWN_FAILED]: 502,
  [MEDIA_ERROR_CODES.OBJECT_GLOW_TIMEOUT]: 504,
  [MEDIA_ERROR_CODES.OBJECT_GLOW_BAD_JSON]: 502,
  [MEDIA_ERROR_CODES.OBJECT_GLOW_PROCESS_FAILED]: 422,
  [MEDIA_ERROR_CODES.MEDIA_OUTPUT_MISSING]: 502,
  [MEDIA_ERROR_CODES.MEDIA_DERIVATIVE_SYNC_FAILED]: 422,
  [MEDIA_ERROR_CODES.MEDIA_JOB_NOT_FOUND]: 404,
  [MEDIA_ERROR_CODES.MEDIA_JOB_QUEUE_FULL]: 429,
});

class MediaError extends Error {
  constructor(code, message, details = {}) {
    super(message || 'Media subsystem error');
    this.name = 'MediaError';
    this.code = String(code || MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT);
    this.details = details && typeof details === 'object' ? { ...details } : {};

    if (Number.isInteger(details?.exitCode)) {
      this.exitCode = details.exitCode;
    }

    if (typeof details?.inputPath === 'string') {
      this.inputPath = details.inputPath;
    }

    if (typeof details?.outputPath === 'string') {
      this.outputPath = details.outputPath;
    }

    if (typeof details?.stderr === 'string') {
      this.stderr = details.stderr;
    }

    if (typeof details?.stdoutSnippet === 'string') {
      this.stdoutSnippet = details.stdoutSnippet;
    }
  }
}

function createMediaError(code, message, details = {}) {
  return new MediaError(code, message, details);
}

function isMediaError(error) {
  return error instanceof MediaError ||
    Boolean(error?.code && Object.values(MEDIA_ERROR_CODES).includes(String(error.code)));
}

function toMediaErrorPayload(error, fallback = {}) {
  const fallbackCode = fallback.code || MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT;
  const fallbackMessage = fallback.message || 'Media operation failed';

  const payload = {
    code: String(error?.code || fallbackCode),
    message: error?.message || fallbackMessage,
    exitCode: Number.isInteger(error?.exitCode) ? error.exitCode : null,
    stderr: typeof error?.stderr === 'string' ? error.stderr : '',
    stdoutSnippet: typeof error?.stdoutSnippet === 'string' ? error.stdoutSnippet : '',
    inputPath: typeof error?.inputPath === 'string' ? error.inputPath : '',
    outputPath: typeof error?.outputPath === 'string' ? error.outputPath : '',
  };

  if (error?.details && typeof error.details === 'object') {
    payload.details = { ...error.details };
  }

  return payload;
}

function getMediaErrorHttpStatus(error) {
  const code = String(error?.code || '');
  if (code && Object.prototype.hasOwnProperty.call(HTTP_STATUS_BY_CODE, code)) {
    return HTTP_STATUS_BY_CODE[code];
  }
  return 500;
}

module.exports = {
  MEDIA_ERROR_CODES,
  MediaError,
  createMediaError,
  isMediaError,
  toMediaErrorPayload,
  getMediaErrorHttpStatus,
};
