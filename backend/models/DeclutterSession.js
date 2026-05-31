const mongoose = require('mongoose');

const DECLUTTER_SESSION_STATUSES = ['active', 'archived'];

const declutterSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'session name must be 140 characters or fewer'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'session description must be 2000 characters or fewer'],
    },
    status: {
      type: String,
      enum: DECLUTTER_SESSION_STATUSES,
      default: 'active',
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

declutterSessionSchema.index({ status: 1, updatedAt: -1 });

const DeclutterSession =
  mongoose.models.DeclutterSession ||
  mongoose.model('DeclutterSession', declutterSessionSchema);

DeclutterSession.STATUSES = DECLUTTER_SESSION_STATUSES;

module.exports = DeclutterSession;
