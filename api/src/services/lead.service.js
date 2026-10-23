import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { parseQueryParams, buildPaginationMeta } from '../utils/queryHelper.js';
import { applyRoleScope, checkDocumentOwnership, getTeamUserIds } from '../middleware/rbac.middleware.js';
import { logEvent } from './timeline.service.js';
import { ENTITY_TYPES, TIMELINE_ACTIONS, ROLES, LEAD_STATUSES } from '../config/constants.js';
import { ConfigService } from './config.service.js';


export const createLead = async (leadData, currentUser) => {
  let assignedUserId = leadData.assignedTo || currentUser._id;

  if (currentUser.role === ROLES.SALES_EXECUTIVE) {
    assignedUserId = currentUser._id;
  } else if (currentUser.role === ROLES.SALES_MANAGER && leadData.assignedTo) {
    const teamUserIds = await getTeamUserIds(currentUser);
    const teamIdStrings = teamUserIds.map((id) => id.toString());
    if (!teamIdStrings.includes(leadData.assignedTo.toString())) {
      throw new ApiError(403, 'Sales Managers can only assign leads to executives within their team');
    }
  }

  // Verify assigned user is active
  const assignedUser = await User.findById(assignedUserId);
  if (!assignedUser || !assignedUser.isActive) {
    throw new ApiError(400, 'Cannot assign lead to an invalid or inactive user');
  }

  const lead = await Lead.create({
    ...leadData,
    assignedTo: assignedUserId,
  });

  // Audit timeline log
  await logEvent({
    action: TIMELINE_ACTIONS.LEAD_CREATED,
    entityType: ENTITY_TYPES.LEAD,
    entityId: lead._id,
    performedBy: currentUser._id,
    newValue: { name: lead.name, email: lead.email, status: lead.status },
    details: `Lead created and assigned to ${assignedUser.name}`,
  });

  return await lead.populate('assignedTo', 'name email role');
};

export const getLeads = async (queryParams, currentUser) => {
  const { filterQuery, sortOptions, page, limit, skip } = parseQueryParams(queryParams, {
    searchFields: ['name', 'email', 'phone', 'company'],
    allowedFilters: ['status', 'priority', 'source', 'assignedTo', 'isConverted'],
    defaultSort: '-createdAt',
  });

  // Enforce role-based access scope
  const scopedFilter = await applyRoleScope({ user: currentUser }, filterQuery, 'assignedTo');

  const [leads, totalRecords] = await Promise.all([
    Lead.find(scopedFilter)
      .populate('assignedTo', 'name email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Lead.countDocuments(scopedFilter),
  ]);

  const meta = buildPaginationMeta(page, limit, totalRecords);
  return { leads, meta };
};

export const getLeadById = async (leadId, currentUser) => {
  const lead = await Lead.findById(leadId).populate('assignedTo', 'name email role');
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  await checkDocumentOwnership(lead, currentUser, 'assignedTo');
  return lead;
};

export const updateLead = async (leadId, updateData, currentUser) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  await checkDocumentOwnership(lead, currentUser, 'assignedTo');

  if (lead.isConverted || lead.status === LEAD_STATUSES.CONVERTED) {
    throw new ApiError(400, 'Cannot modify a lead that has already been converted');
  }

  if (updateData.status === LEAD_STATUSES.CONVERTED) {
    throw new ApiError(
      400,
      "Lead status cannot be directly updated to 'converted'. Please use the lead conversion endpoint (POST /api/v1/leads/:id/convert)"
    );
  }

  const prevStatus = lead.status;
  const prevPriority = lead.priority;

  // Prevent direct update of assignedTo or isConverted via standard update endpoint
  delete updateData.assignedTo;
  delete updateData.isConverted;
  delete updateData.convertedToCustomer;
  delete updateData.convertedToDeal;

  Object.assign(lead, updateData);
  await lead.save();

  // Log timeline for status change
  if (updateData.status && updateData.status !== prevStatus) {
    await logEvent({
      action: TIMELINE_ACTIONS.LEAD_STATUS_CHANGED,
      entityType: ENTITY_TYPES.LEAD,
      entityId: lead._id,
      performedBy: currentUser._id,
      previousValue: prevStatus,
      newValue: updateData.status,
      details: `Status updated from '${prevStatus}' to '${updateData.status}'`,
    });
  }

  // Log timeline for priority change
  if (updateData.priority && updateData.priority !== prevPriority) {
    await logEvent({
      action: TIMELINE_ACTIONS.LEAD_PRIORITY_CHANGED,
      entityType: ENTITY_TYPES.LEAD,
      entityId: lead._id,
      performedBy: currentUser._id,
      previousValue: prevPriority,
      newValue: updateData.priority,
      details: `Priority updated from '${prevPriority}' to '${updateData.priority}'`,
    });
  }

  return await lead.populate('assignedTo', 'name email role');
};

export const updateLeadStatus = async (leadId, status, currentUser) => {
  return await updateLead(leadId, { status }, currentUser);
};

export const assignLead = async (leadId, targetUserId, currentUser) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  if (lead.isConverted) {
    throw new ApiError(400, 'Cannot reassign a converted lead');
  }

  // Enforce CRM Configuration flag for Sales Executive reassignment
  if (currentUser.role === ROLES.SALES_EXECUTIVE) {
    const crmConfig = await ConfigService.getConfig();
    if (!crmConfig.allowExecutiveLeadReassignment) {
      throw new ApiError(403, 'Lead reassignment by Sales Executives is disabled in CRM configuration');
    }
  }

  // Sales Managers can only reassign leads within their team; Executives must own the lead
  await checkDocumentOwnership(lead, currentUser, 'assignedTo');


  const targetUser = await User.findById(targetUserId);
  if (!targetUser || !targetUser.isActive) {
    throw new ApiError(400, 'Cannot assign lead to an invalid or inactive user');
  }

  if (targetUser.role !== ROLES.SALES_EXECUTIVE) {
    throw new ApiError(400, 'Leads can only be assigned to a Sales Executive');
  }

  if (currentUser.role === ROLES.SALES_MANAGER) {
    const teamUserIds = await getTeamUserIds(currentUser);
    const teamIdStrings = teamUserIds.map((id) => id.toString());
    if (!teamIdStrings.includes(targetUser._id.toString())) {
      throw new ApiError(403, 'Sales Managers can only assign leads to executives within their team');
    }
  }

  const prevAssignedId = lead.assignedTo;
  lead.assignedTo = targetUser._id;
  await lead.save();

  const action = prevAssignedId ? TIMELINE_ACTIONS.LEAD_REASSIGNED : TIMELINE_ACTIONS.LEAD_ASSIGNED;
  await logEvent({
    action,
    entityType: ENTITY_TYPES.LEAD,
    entityId: lead._id,
    performedBy: currentUser._id,
    previousValue: prevAssignedId,
    newValue: targetUser._id,
    details: `Lead assigned to ${targetUser.name} (${targetUser.role})`,
  });

  return await lead.populate('assignedTo', 'name email role');
};

export const deleteLead = async (leadId, currentUser) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  await checkDocumentOwnership(lead, currentUser, 'assignedTo');
  await Lead.findByIdAndDelete(leadId);
  return true;
};

export const LeadService = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  deleteLead,
};

