export const ROLES = {
  ADMIN: 'Admin',
  SALES_MANAGER: 'Sales Manager',
  SALES_EXECUTIVE: 'Sales Executive',
};

export const LEAD_SOURCES = {
  WEBSITE: 'website',
  REFERRAL: 'referral',
  SOCIAL_MEDIA: 'social_media',
  EMAIL: 'email',
  PHONE: 'phone',
  OTHER: 'other',
};

export const LEAD_STATUSES = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  UNQUALIFIED: 'unqualified',
  CONVERTED: 'converted',
  LOST: 'lost',
};

export const LEAD_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const CUSTOMER_STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  CHURNED: 'Churned',
};

export const DEAL_STAGES = {
  QUALIFICATION: 'Qualification',
  DISCOVERY: 'Discovery',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

export const ACTIVITY_TYPES = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  DEMO: 'Demo',
  FOLLOW_UP: 'Follow-up',
  REMINDER: 'Reminder',
  NOTE: 'Note',
};

export const ACTIVITY_STATUSES = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
};

export const ENTITY_TYPES = {
  LEAD: 'Lead',
  CUSTOMER: 'Customer',
  DEAL: 'Deal',
  USER: 'User',
};

export const TIMELINE_ACTIONS = {
  LEAD_CREATED: 'Lead Created',
  LEAD_ASSIGNED: 'Lead Assigned',
  LEAD_REASSIGNED: 'Lead Reassigned',
  LEAD_STATUS_CHANGED: 'Lead Status Changed',
  LEAD_PRIORITY_CHANGED: 'Lead Priority Changed',
  NOTE_ADDED: 'Note Added',
  FOLLOW_UP_CREATED: 'Follow-up Created',
  FOLLOW_UP_COMPLETED: 'Follow-up Completed',
  CUSTOMER_CREATED: 'Customer Created',
  LEAD_CONVERTED: 'Lead Converted',
  DEAL_CREATED: 'Deal Created',
  DEAL_STAGE_CHANGED: 'Deal Stage Changed',
  DEAL_ASSIGNED: 'Deal Assigned',
  DEAL_WON: 'Deal Won',
  DEAL_LOST: 'Deal Lost',
  ACTIVITY_CREATED: 'Activity Created',
  ACTIVITY_COMPLETED: 'Activity Completed',
};
