const mongoose = require('mongoose');

const EVENT_TYPES = Object.freeze([
  'box_created',
  'box_updated',
  'box_moved',
  'box_nested',
  'box_unnested',
  'box_destroyed',
  'box_photo_updated',
  'item_created',
  'item_updated',
  'item_moved',
  'items_bulk_imported',
  'item_marked_gone',
  'item_reclaimed',
  'item_deleted',
  'item_photo_updated',
]);

const eventLogSchema = new mongoose.Schema(
  {
    created_at: { type: Date, default: Date.now, index: true },
    event_type: { type: String, required: true, enum: EVENT_TYPES, index: true },
    entity_type: { type: String, required: true, enum: ['box', 'item'], index: true },
    entity_id: { type: String, required: true, index: true },
    entity_label: { type: String, required: true, default: '' },
    summary: { type: String, required: true, trim: true },
    details: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  {
    versionKey: false,
  }
);

eventLogSchema.index({ created_at: -1, _id: -1 });

const EventLog = mongoose.model('EventLog', eventLogSchema);

module.exports = {
  EventLog,
  EVENT_TYPES,
};
