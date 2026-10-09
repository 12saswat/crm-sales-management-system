import mongoose from 'mongoose';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_PRIORITIES } from '../config/constants.js';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [120, 'Lead name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Lead email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: Object.values(LEAD_SOURCES),
        message: 'Invalid lead source',
      },
      default: LEAD_SOURCES.WEBSITE,
    },
    status: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: Object.values(LEAD_STATUSES),
        message: 'Invalid lead status',
      },
      default: LEAD_STATUSES.NEW,
    },
    priority: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: Object.values(LEAD_PRIORITIES),
        message: 'Invalid lead priority',
      },
      default: LEAD_PRIORITIES.MEDIUM,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned sales executive is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isConverted: {
      type: Boolean,
      default: false,
    },
    convertedAt: {
      type: Date,
      default: null,
    },
    convertedToCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    convertedToDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      default: null,
    },
  },
  {
    timestamps: true,
    validateModifiedOnly: true,
  }
);

// Database Performance Indexes
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ assignedTo: 1, status: 1 });

export const Lead = mongoose.model('Lead', leadSchema);
