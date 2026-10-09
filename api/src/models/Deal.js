import mongoose from 'mongoose';
import { DEAL_STAGES } from '../config/constants.js';

const dealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Deal name is required'],
      trim: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Associated customer is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned sales executive is required'],
    },
    value: {
      type: Number,
      required: [true, 'Deal value is required'],
      min: [0.01, 'Deal value must be greater than zero'],
    },
    probability: {
      type: Number,
      min: [0, 'Probability cannot be less than 0'],
      max: [100, 'Probability cannot be greater than 100'],
      default: 50,
    },
    expectedRevenue: {
      type: Number,
      default: 0,
    },
    expectedClosingDate: {
      type: Date,
      required: [true, 'Expected closing date is required'],
    },
    stage: {
      type: String,
      enum: {
        values: Object.values(DEAL_STAGES),
        message: 'Invalid deal stage',
      },
      default: DEAL_STAGES.QUALIFICATION,
    },
    lostReason: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save calculation hook for expected revenue
dealSchema.pre('save', function () {
  if (this.value !== undefined && this.probability !== undefined) {
    this.expectedRevenue = parseFloat(((this.value * this.probability) / 100).toFixed(2));
  }
});

// Indexes
dealSchema.index({ stage: 1 });
dealSchema.index({ assignedTo: 1 });
dealSchema.index({ customer: 1 });
dealSchema.index({ lead: 1 });
dealSchema.index({ value: 1 });
dealSchema.index({ expectedClosingDate: 1 });
dealSchema.index({ createdAt: -1 });
dealSchema.index({ assignedTo: 1, stage: 1 });

export const Deal = mongoose.model('Deal', dealSchema);
