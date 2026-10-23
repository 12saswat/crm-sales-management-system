import mongoose from 'mongoose';
import { CUSTOMER_STATUSES } from '../config/constants.js';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          if (!v || v.trim() === '') return true;
          const cleaned = v.replace(/[\s\-\.\(\)]/g, '');
          return /^\+?[1-9]\d{9,14}$/.test(cleaned);
        },
        message: 'Phone number must be a valid format with 10 to 15 digits',
      },
    },

    company: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    originalLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned sales executive is required'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(CUSTOMER_STATUSES),
        message: 'Invalid customer status',
      },
      default: CUSTOMER_STATUSES.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ originalLead: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ createdAt: -1 });

export const Customer = mongoose.model('Customer', customerSchema);
