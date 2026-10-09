import mongoose from 'mongoose';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, ENTITY_TYPES } from '../config/constants.js';

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: Object.values(ACTIVITY_TYPES),
        message: 'Invalid activity type',
      },
      required: [true, 'Activity type is required'],
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ACTIVITY_STATUSES),
        message: 'Invalid activity status',
      },
      default: ACTIVITY_STATUSES.PENDING,
    },
    entityType: {
      type: String,
      enum: {
        values: Object.values(ENTITY_TYPES),
        message: 'Invalid entity type',
      },
      required: [true, 'Associated entity type is required'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Associated entity ID is required'],
      refPath: 'entityType',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to dynamically detect overdue activities
activitySchema.virtual('isOverdue').get(function () {
  if (this.status === ACTIVITY_STATUSES.COMPLETED) return false;
  if (!this.dueDate) return false;
  return new Date(this.dueDate) < new Date();
});

// Indexes
activitySchema.index({ assignedTo: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ dueDate: 1 });
activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ assignedTo: 1, status: 1 });

export const Activity = mongoose.model('Activity', activitySchema);
