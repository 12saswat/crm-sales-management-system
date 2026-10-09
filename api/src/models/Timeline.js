import mongoose from 'mongoose';
import { ENTITY_TYPES, TIMELINE_ACTIONS } from '../config/constants.js';

const timelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Timeline action is required'],
      trim: true,
    },
    entityType: {
      type: String,
      enum: {
        values: Object.values(ENTITY_TYPES),
        message: 'Invalid entity type',
      },
      required: [true, 'Entity type is required'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
      refPath: 'entityType',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User performing action is required'],
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
timelineSchema.index({ entityType: 1, entityId: 1 });
timelineSchema.index({ performedBy: 1 });
timelineSchema.index({ timestamp: -1 });

export const Timeline = mongoose.model('Timeline', timelineSchema);
