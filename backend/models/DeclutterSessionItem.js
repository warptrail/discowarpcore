const mongoose = require('mongoose');

const DECLUTTER_DECISIONS = [
  'pending',
  'keep',
  'toss',
  'donate',
  'sell',
  'unsure',
];

const declutterSessionItemSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeclutterSession',
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    decision: {
      type: String,
      enum: DECLUTTER_DECISIONS,
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'declutter notes must be 2000 characters or fewer'],
    },
    proposedBy: { type: String, default: '', trim: true },
    decidedBy: { type: String, default: '', trim: true },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

declutterSessionItemSchema.index(
  { sessionId: 1, itemId: 1 },
  { unique: true }
);
declutterSessionItemSchema.index({ sessionId: 1, decision: 1 });

const DeclutterSessionItem =
  mongoose.models.DeclutterSessionItem ||
  mongoose.model('DeclutterSessionItem', declutterSessionItemSchema);

DeclutterSessionItem.DECISIONS = DECLUTTER_DECISIONS;

module.exports = DeclutterSessionItem;
