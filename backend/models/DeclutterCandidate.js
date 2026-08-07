const mongoose = require('mongoose');

const DECLUTTER_PLAYERS = ['discofish', 'laserfox'];
const VOTE_VALUES = ['pending', 'keep', 'release', 'unsure'];
const VISIBLE_VOTE_CHOICES = ['keep', 'toss', 'donate', 'sell', 'gift', 'unsure'];
const EXIT_PREFERENCES = ['discard', 'donate', 'sell', 'gift'];
const STAGING_ROUTES = ['discard', 'donate', 'sell', 'gift', 'needs_routing'];
const DECK_STATES = ['active', 'discussion', 'action', 'resolved'];
const CONFIRMATION_STATES = ['voting', 'confirmed'];
const RESOLUTIONS = ['pending', 'kept', 'release_approved', 'review_later', 'conflict'];

const voteSchema = new mongoose.Schema(
  {
    decision: { type: String, enum: VOTE_VALUES, default: 'pending' },
    exitPreference: {
      type: String,
      enum: [...EXIT_PREFERENCES, null],
      default: null,
    },
    decidedAt: { type: Date, default: null },
  },
  { _id: false }
);

const declutterCandidateSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      unique: true,
      index: true,
    },
    nominatedBy: { type: String, enum: [...DECLUTTER_PLAYERS, ''], default: '' },
    nominatedAt: { type: Date, default: Date.now },
    votes: {
      discofish: { type: voteSchema, default: () => ({}) },
      laserfox: { type: voteSchema, default: () => ({}) },
    },
    deckState: { type: String, enum: DECK_STATES, default: 'active', index: true },
    resolution: { type: String, enum: RESOLUTIONS, default: 'pending', index: true },
    stagingRoute: {
      type: String,
      enum: [...STAGING_ROUTES, null],
      default: null,
      index: true,
    },
    confirmationState: {
      type: String,
      enum: CONFIRMATION_STATES,
      default: 'voting',
      index: true,
    },
    consensusReachedAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    actionCompletedAt: { type: Date, default: null, index: true },
    preActionBoxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Box',
      default: null,
    },
    actionOverride: {
      player: { type: String, enum: [...DECLUTTER_PLAYERS, 'system', ''], default: '' },
      action: { type: String, default: '', trim: true },
      reason: { type: String, default: '', trim: true, maxlength: 1000 },
      previousRoute: { type: String, default: null },
      nextRoute: { type: String, default: null },
      at: { type: Date, default: null },
    },
    roundHistory: [
      {
        votes: {
          discofish: { type: voteSchema, default: () => ({}) },
          laserfox: { type: voteSchema, default: () => ({}) },
        },
        deckState: { type: String, default: '' },
        confirmationState: { type: String, default: '' },
        resolution: { type: String, default: '' },
        stagingRoute: { type: String, default: null },
        consensusReachedAt: { type: Date, default: null },
        confirmedAt: { type: Date, default: null },
        actionCompletedAt: { type: Date, default: null },
        resolvedAt: { type: Date, default: null },
        notes: { type: String, default: '' },
        reason: { type: String, default: '' },
        archivedAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date, default: null },
    notes: { type: String, default: '', trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

declutterCandidateSchema.index({ deckState: 1, updatedAt: -1 });

const DeclutterCandidate =
  mongoose.models.DeclutterCandidate ||
  mongoose.model('DeclutterCandidate', declutterCandidateSchema);

DeclutterCandidate.PLAYERS = DECLUTTER_PLAYERS;
DeclutterCandidate.VOTES = VOTE_VALUES;
DeclutterCandidate.VISIBLE_VOTE_CHOICES = VISIBLE_VOTE_CHOICES;
DeclutterCandidate.EXIT_PREFERENCES = EXIT_PREFERENCES;
DeclutterCandidate.STAGING_ROUTES = STAGING_ROUTES;
DeclutterCandidate.DECK_STATES = DECK_STATES;
DeclutterCandidate.CONFIRMATION_STATES = CONFIRMATION_STATES;
DeclutterCandidate.RESOLUTIONS = RESOLUTIONS;

module.exports = DeclutterCandidate;
