import mongoose from 'mongoose';

/**
 * Parses pagination, search, filter, date-range, and sort options for Mongoose models.
 * @param {Object} queryParams - Express req.query
 * @param {Object} configOptions - Config containing searchFields, allowedFilters, defaultSort
 * @returns {Object} { filterQuery, sortOptions, page, limit, skip }
 */
export const parseQueryParams = (queryParams = {}, configOptions = {}) => {
  const {
    searchFields = [],
    allowedFilters = [],
    defaultSort = '-createdAt',
  } = configOptions;

  const page = Math.max(1, parseInt(queryParams.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit || '10', 10)));
  const skip = (page - 1) * limit;

  const filterQuery = {};

  // 1. Keyword search across fields
  if (queryParams.search && searchFields.length > 0) {
    const searchRegex = new RegExp(queryParams.search.trim(), 'i');
    filterQuery.$or = searchFields.map((field) => ({
      [field]: searchRegex,
    }));
  }

  // 2. Exact match filters
  allowedFilters.forEach((filterKey) => {
    if (queryParams[filterKey] !== undefined && queryParams[filterKey] !== '') {
      const val = queryParams[filterKey];
      if (val === 'true' || val === 'false') {
        filterQuery[filterKey] = val === 'true';
      } else if (mongoose.Types.ObjectId.isValid(val)) {
        filterQuery[filterKey] = new mongoose.Types.ObjectId(val);
      } else if (typeof val === 'string' && val.includes(',')) {
        const enumFields = ['status', 'priority', 'source'];
        const values = val.split(',').map((v) => {
          const trimmed = v.trim();
          return enumFields.includes(filterKey) ? trimmed.toLowerCase() : trimmed;
        });
        filterQuery[filterKey] = { $in: values };
      } else {
        const enumFields = ['status', 'priority', 'source'];
        filterQuery[filterKey] = typeof val === 'string' && enumFields.includes(filterKey) ? val.toLowerCase() : val;
      }
    }
  });

  // 3. Amount / Value range filters (minAmount, maxAmount)
  if (queryParams.minAmount !== undefined || queryParams.maxAmount !== undefined) {
    filterQuery.value = {};
    if (queryParams.minAmount !== undefined) {
      filterQuery.value.$gte = parseFloat(queryParams.minAmount);
    }
    if (queryParams.maxAmount !== undefined) {
      filterQuery.value.$lte = parseFloat(queryParams.maxAmount);
    }
  }

  // 4. Date range filter on createdAt or expectedClosingDate
  const dateField = queryParams.dateField || 'createdAt';
  if (queryParams.startDate || queryParams.endDate) {
    filterQuery[dateField] = {};
    if (queryParams.startDate) {
      filterQuery[dateField].$gte = new Date(queryParams.startDate);
    }
    if (queryParams.endDate) {
      // Set to end of day if only date is passed
      const endDate = new Date(queryParams.endDate);
      if (!queryParams.endDate.includes('T')) {
        endDate.setHours(23, 59, 59, 999);
      }
      filterQuery[dateField].$lte = endDate;
    }
  }

  // 5. Sorting
  let sortOptions = defaultSort;
  if (queryParams.sortBy) {
    const order = queryParams.sortOrder === 'asc' || queryParams.sortOrder === '1' ? '' : '-';
    sortOptions = `${order}${queryParams.sortBy}`;
  }

  return { filterQuery, sortOptions, page, limit, skip };
};

/**
 * Utility to format standardized pagination response metadata
 */
export const buildPaginationMeta = (page, limit, totalRecords) => {
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  return {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
