const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true, maxlength: 160 },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  gathered: { type: Boolean, default: false },
  returned: { type: Boolean, default: false },
});

const loadoutSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  notes: { type: String, default: '', maxlength: 2000 },
  occasion: { type: String, enum: ['camping', 'travel', 'roadtrip', 'festival', 'edc', 'emergency', 'custom'], default: 'custom' },
  entries: { type: [entrySchema], default: [] },
  revision: { type: Number, default: 0 },
  archived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Loadout', loadoutSchema);
