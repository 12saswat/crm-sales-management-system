import { LeadService } from '../services/lead.service.js';
import { LeadConversionService } from '../services/leadConversion.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createLead = asyncHandler(async (req, res) => {
  const lead = await LeadService.createLead(req.body, req.user);
  return ApiResponse.created(res, 'Lead created successfully', lead);
});

export const getLeads = asyncHandler(async (req, res) => {
  const { leads, meta } = await LeadService.getLeads(req.query, req.user);
  return ApiResponse.success(res, 200, 'Leads fetched successfully', leads, meta);
});

export const getLeadById = asyncHandler(async (req, res) => {
  const lead = await LeadService.getLeadById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Lead details fetched successfully', lead);
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await LeadService.updateLead(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Lead updated successfully', lead);
});

export const updateLeadStatus = asyncHandler(async (req, res) => {
  const lead = await LeadService.updateLeadStatus(req.params.id, req.body.status, req.user);
  return ApiResponse.success(res, 200, 'Lead status updated successfully', lead);
});

export const assignLead = asyncHandler(async (req, res) => {
  const lead = await LeadService.assignLead(req.params.id, req.body.assignedTo, req.user);
  return ApiResponse.success(res, 200, 'Lead assigned successfully', lead);
});

export const convertLead = asyncHandler(async (req, res) => {
  const result = await LeadConversionService.convertLead(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Lead converted successfully', result);
});

export const deleteLead = asyncHandler(async (req, res) => {
  await LeadService.deleteLead(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Lead deleted successfully');
});
