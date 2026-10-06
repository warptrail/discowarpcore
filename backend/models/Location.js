const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true, index: true },
    vicinity: { type: String, default: '', trim: true },
    specifics: { type: String, default: '', trim: true },
    exactSpot: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

locationSchema.index({ room: 1, vicinity: 1, specifics: 1, exactSpot: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Location', locationSchema);
