const mongoose = require('mongoose');
const { createMediaId } = require('../utils/mediaId');

const ACTIVE_VARIANTS = ['original', 'processed'];
const PROCESSING_STATUSES = [
  'idle',
  'ready_for_processing',
  'queued',
  'processing',
  'completed',
  'failed',
];

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function variantOrNull(value) {
  const next = toTrimmed(value).toLowerCase();
  if (!next) return null;
  return ACTIVE_VARIANTS.includes(next) ? next : value;
}

const mediaStateSchema = new mongoose.Schema(
  {
    mediaId: {
      type: String,
      required: true,
      trim: true,
      default: createMediaId,
    },
    originalPath: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    processedPath: { type: String, default: '', trim: true },
    displayPath: { type: String, default: '', trim: true },
    thumbPath: { type: String, default: '', trim: true },
    renderTokens: {
      mode: { type: String, default: 'explicit', trim: true },
      background: { type: String, default: '', trim: true },
      glow: { type: String, default: '', trim: true },
      accent: { type: String, default: '', trim: true },
    },
    activeVariant: {
      type: String,
      enum: ACTIVE_VARIANTS,
      default: 'original',
      index: true,
    },
    displayDerivedFrom: {
      type: String,
      default: null,
      set: variantOrNull,
      validate: {
        validator(value) {
          return value == null || ACTIVE_VARIANTS.includes(value);
        },
        message: 'displayDerivedFrom must be original, processed, or null',
      },
      index: true,
    },
    thumbDerivedFrom: {
      type: String,
      default: null,
      set: variantOrNull,
      validate: {
        validator(value) {
          return value == null || ACTIVE_VARIANTS.includes(value);
        },
        message: 'thumbDerivedFrom must be original, processed, or null',
      },
      index: true,
    },
    processingStatus: {
      type: String,
      enum: PROCESSING_STATUSES,
      default: 'idle',
      index: true,
    },
    sourceType: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    processingError: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

mediaStateSchema.index(
  { mediaId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      mediaId: { $type: 'string', $regex: '^med_' },
    },
  }
);

mediaStateSchema.pre('validate', function normalizePathFields(next) {
  this.mediaId = toTrimmed(this.mediaId) || createMediaId();
  this.originalPath = toTrimmed(this.originalPath);
  this.processedPath = toTrimmed(this.processedPath);
  this.displayPath = toTrimmed(this.displayPath);
  this.thumbPath = toTrimmed(this.thumbPath);
  if (this.renderTokens && typeof this.renderTokens === 'object') {
    this.renderTokens.mode = toTrimmed(this.renderTokens.mode).toLowerCase() || 'explicit';
    this.renderTokens.background = toTrimmed(this.renderTokens.background);
    this.renderTokens.glow = toTrimmed(this.renderTokens.glow);
    this.renderTokens.accent = toTrimmed(this.renderTokens.accent);
  }
  this.sourceType = toTrimmed(this.sourceType).toLowerCase();
  next();
});

module.exports = mongoose.model('MediaState', mediaStateSchema);
