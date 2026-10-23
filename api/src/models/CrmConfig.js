import mongoose from 'mongoose';
import { LEAD_SOURCES, LEAD_STATUSES, DEAL_STAGES } from '../config/constants.js';

const crmConfigSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'Odisha CRM Solutions',
      trim: true,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    leadSources: {
      type: [String],
      default: Object.values(LEAD_SOURCES),
    },
    leadStatuses: {
      type: [String],
      default: Object.values(LEAD_STATUSES),
    },
    dealStages: {
      type: [String],
      default: Object.values(DEAL_STAGES),
    },
    defaultDealProbabilities: {
      type: Map,
      of: Number,
      default: {
        Qualification: 10,
        Discovery: 25,
        Proposal: 50,
        Negotiation: 75,
        Won: 100,
        Lost: 0,
      },
    },
    allowExecutiveLeadReassignment: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CrmConfig = mongoose.model('CrmConfig', crmConfigSchema);
