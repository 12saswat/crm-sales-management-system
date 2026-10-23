import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { parseQueryParams, buildPaginationMeta } from '../utils/queryHelper.js';
import { applyRoleScope, checkDocumentOwnership, getTeamUserIds } from '../middleware/rbac.middleware.js';
import { logEvent } from './timeline.service.js';
import { ENTITY_TYPES, TIMELINE_ACTIONS, ROLES } from '../config/constants.js';

export const createCustomer = async (customerData, currentUser) => {
  if (customerData.originalLead) {
    const originalLead = await Lead.findById(customerData.originalLead);
    if (!originalLead) {
      throw new ApiError(404, 'Associated original lead not found');
    }
    await checkDocumentOwnership(originalLead, currentUser, 'assignedTo');
  }

  let assignedUserId = customerData.assignedTo || currentUser._id;

  if (currentUser.role === ROLES.SALES_EXECUTIVE) {
    assignedUserId = currentUser._id;
  } else if (currentUser.role === ROLES.SALES_MANAGER && customerData.assignedTo) {
    const teamUserIds = await getTeamUserIds(currentUser);
    const teamIdStrings = teamUserIds.map((id) => id.toString());
    if (!teamIdStrings.includes(customerData.assignedTo.toString())) {
      throw new ApiError(403, 'Sales Managers can only assign customers to executives within their team');
    }
  }

  const assignedUser = await User.findById(assignedUserId);
  if (!assignedUser || !assignedUser.isActive) {
    throw new ApiError(400, 'Assigned user is invalid or inactive');
  }

  const customer = await Customer.create({
    ...customerData,
    assignedTo: assignedUserId,
  });

  // Audit timeline log for customer creation outside lead conversion
  await logEvent({
    action: TIMELINE_ACTIONS.CUSTOMER_CREATED,
    entityType: ENTITY_TYPES.CUSTOMER,
    entityId: customer._id,
    performedBy: currentUser._id,
    newValue: { name: customer.name, email: customer.email },
    details: `Customer created directly by ${currentUser.name || 'user'}`,
  });

  return await customer.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'originalLead', select: 'name email status source' },
  ]);
};

export const getCustomers = async (queryParams, currentUser) => {
  const { filterQuery, sortOptions, page, limit, skip } = parseQueryParams(queryParams, {
    searchFields: ['name', 'email', 'phone', 'company'],
    allowedFilters: ['status', 'assignedTo', 'originalLead'],
    defaultSort: '-createdAt',
  });

  const scopedFilter = await applyRoleScope({ user: currentUser }, filterQuery, 'assignedTo');

  const [customers, totalRecords] = await Promise.all([
    Customer.find(scopedFilter)
      .populate('assignedTo', 'name email role')
      .populate('originalLead', 'name email status source')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Customer.countDocuments(scopedFilter),
  ]);

  const meta = buildPaginationMeta(page, limit, totalRecords);
  return { customers, meta };
};

export const getCustomerById = async (customerId, currentUser) => {
  const customer = await Customer.findById(customerId)
    .populate('assignedTo', 'name email role')
    .populate('originalLead', 'name email status source');

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  await checkDocumentOwnership(customer, currentUser, 'assignedTo');
  return customer;
};

export const updateCustomer = async (customerId, updateData, currentUser) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  await checkDocumentOwnership(customer, currentUser, 'assignedTo');

  Object.assign(customer, updateData);
  await customer.save();

  return await customer.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'originalLead', select: 'name email status source' },
  ]);
};

export const deleteCustomer = async (customerId, currentUser) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  await checkDocumentOwnership(customer, currentUser, 'assignedTo');
  await Customer.findByIdAndDelete(customerId);
  return true;
};

export const CustomerService = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};

