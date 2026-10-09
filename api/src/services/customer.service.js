import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { parseQueryParams, buildPaginationMeta } from '../utils/queryHelper.js';
import { applyRoleScope, checkDocumentOwnership } from '../middleware/rbac.middleware.js';


export const createCustomer = async (customerData, currentUser) => {
  const assignedUserId = customerData.assignedTo || currentUser._id;
  const assignedUser = await User.findById(assignedUserId);
  if (!assignedUser || !assignedUser.isActive) {
    throw new ApiError(400, 'Assigned user is invalid or inactive');
  }

  const customer = await Customer.create({
    ...customerData,
    assignedTo: assignedUserId,
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

  const scopedFilter = applyRoleScope({ user: currentUser }, filterQuery, 'assignedTo');

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

  checkDocumentOwnership(customer, currentUser, 'assignedTo');
  return customer;
};

export const updateCustomer = async (customerId, updateData, currentUser) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  checkDocumentOwnership(customer, currentUser, 'assignedTo');

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

  checkDocumentOwnership(customer, currentUser, 'assignedTo');
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
