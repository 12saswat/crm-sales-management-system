import swaggerUi from 'swagger-ui-express';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CRM Sales Management System API',
    version: '1.0.0',
    description:
      'Production Ready RESTful API for CRM Sales Management System (Lead generation -> Lead qualification -> Customer conversion -> Deal pipeline management -> Deal closure).',
  },
  servers: [
    {
      url: 'http://localhost:4040/api/v1',
      description: 'Local Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User Registration, Login, Logout, Profile & Password management' },
    { name: 'User Management', description: 'Admin user management operations' },
    { name: 'Lead Management', description: 'Lead tracking, status updates, assignment & atomic conversion' },
    { name: 'Customer Management', description: 'Customer records derived from converted leads' },
    { name: 'Deal Management', description: 'Sales pipeline deal tracking, stage progression & expected revenue' },
    { name: 'Activity Management', description: 'Follow-ups, calls, meetings & task tracking' },
    { name: 'Timeline Audit', description: 'Audit history logging across all CRM entities' },
    { name: 'Dashboard & Analytics', description: 'Sales overview metrics, pipeline stage breakdown & team performance' },
    { name: 'CRM Configuration', description: 'Admin system configuration and CRM parameters' },
  ],

  paths: {
    // --- AUTHENTICATION ---
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        description: 'Creates a new user account in the CRM (public registration is restricted to Sales Executive role).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  phone: { type: 'string', example: '+919876543210' },
                  password: { type: 'string', example: 'UserPass123!' },
                  role: {
                    type: 'string',
                    enum: ['Sales Executive'],
                    default: 'Sales Executive',
                    example: 'Sales Executive',
                    description: 'Public registration is restricted to Sales Executive role only. Management accounts are created by an administrator via User Management.',
                  },
                },
              },
            },
          },
        },

        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation error or email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticates user and returns JWT token & HttpOnly cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@crm.com' },
                  password: { type: 'string', example: 'AdminPass123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful with JWT access token' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout user',
        description: 'Clears authentication token cookie.',
        responses: {
          200: { description: 'Logged out successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current logged-in user profile',
        responses: {
          200: { description: 'User profile retrieved successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/change-password': {
      patch: {
        tags: ['Authentication'],
        summary: 'Change user password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'AdminPass123!' },
                  newPassword: { type: 'string', example: 'NewSecurePass123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated successfully' },
          400: { description: 'Incorrect current password or invalid format' },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // --- USER MANAGEMENT (ADMIN ONLY) ---
    '/users': {
      get: {
        tags: ['User Management'],
        summary: 'Get paginated list of users',
        description: 'Retrieve users list with filtering by role, status, and search query. Admin only.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, email, or phone' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['Admin', 'Sales Manager', 'Sales Executive'] } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' }, description: 'Sort field (e.g., name, -createdAt)' },
        ],
        responses: {
          200: { description: 'Users list retrieved successfully' },
          403: { description: 'Forbidden (Admin role required)' },
        },
      },
      post: {
        tags: ['User Management'],
        summary: 'Create a new user',
        description: 'Creates a new user account. Admin only.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string', example: 'Jane Smith' },
                  email: { type: 'string', example: 'jane@crm.com' },
                  phone: { type: 'string', example: '+919876543219' },
                  password: { type: 'string', example: 'ManagerPass123!' },
                  role: { type: 'string', enum: ['Admin', 'Sales Manager', 'Sales Executive'], example: 'Sales Manager' },
                  isActive: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User created successfully' },
          400: { description: 'Validation error or duplicate email' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['User Management'],
        summary: 'Get user by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User details fetched' },
          404: { description: 'User not found' },
        },
      },
      put: {
        tags: ['User Management'],
        summary: 'Update user information',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Jane Smith Updated' },
                  phone: { type: 'string', example: '+919876543219' },
                  role: { type: 'string', enum: ['Admin', 'Sales Manager', 'Sales Executive'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User updated successfully' },
          404: { description: 'User not found' },
        },
      },
      delete: {
        tags: ['User Management'],
        summary: 'Delete a user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User deleted successfully' },
          404: { description: 'User not found' },
        },
      },
    },
    '/users/{id}/status': {
      patch: {
        tags: ['User Management'],
        summary: 'Toggle active status of a user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: {
                  isActive: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User status updated successfully' },
          404: { description: 'User not found' },
        },
      },
    },

    // --- LEADS MANAGEMENT ---
    '/leads': {
      get: {
        tags: ['Lead Management'],
        summary: 'Get paginated list of leads with search and filters',
        description: 'Retrieve leads list with keyword search across name/email/phone/company, filters for status, priority, source, assigned executive, conversion status, date ranges, and custom sorting.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search across lead name, email, phone, and company' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
          { name: 'source', in: 'query', schema: { type: 'string', enum: ['website', 'referral', 'social_media', 'email', 'phone', 'other'] } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' }, description: 'User ID of assigned sales executive' },
          { name: 'isConverted', in: 'query', schema: { type: 'boolean' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter created on or after date (YYYY-MM-DD)' },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter created on or before date (YYYY-MM-DD)' },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' }, description: 'Sort field (e.g. name, -createdAt, priority)' },
        ],
        responses: {
          200: { description: 'Leads retrieved successfully' },
        },
      },
      post: {
        tags: ['Lead Management'],
        summary: 'Create a new lead',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string', example: 'Acme Solutions' },
                  email: { type: 'string', example: 'contact@acmesolutions.com' },
                  phone: { type: 'string', example: '+18005550199' },
                  company: { type: 'string', example: 'Acme Inc' },
                  source: { type: 'string', example: 'website' },
                  status: { type: 'string', example: 'new' },
                  priority: { type: 'string', example: 'high' },
                  description: { type: 'string', example: 'Interested in enterprise cloud deployment' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Lead created successfully' },
        },
      },
    },
    '/leads/{id}': {
      get: {
        tags: ['Lead Management'],
        summary: 'Get lead details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Lead details retrieved' },
          404: { description: 'Lead not found' },
        },
      },
      put: {
        tags: ['Lead Management'],
        summary: 'Update lead details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  company: { type: 'string' },
                  source: { type: 'string' },
                  status: { type: 'string' },
                  priority: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Lead updated successfully' },
        },
      },
      delete: {
        tags: ['Lead Management'],
        summary: 'Delete lead',
        description: 'Admin and Sales Manager only.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Lead deleted successfully' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/leads/{id}/status': {
      patch: {
        tags: ['Lead Management'],
        summary: 'Update lead status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'], example: 'qualified' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Lead status updated' },
        },
      },
    },
    '/leads/{id}/assign': {
      patch: {
        tags: ['Lead Management'],
        summary: 'Assign or reassign lead to a sales executive',
        description: 'Admin and Sales Manager only.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assignedTo'],
                properties: {
                  assignedTo: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Lead assigned successfully' },
        },
      },
    },
    '/leads/{id}/convert': {
      post: {
        tags: ['Lead Management'],
        summary: 'Convert lead to Customer and Deal',
        description: 'Safely converts a qualified lead into a Customer record and optional linked Deal using a database session.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customerAddress: { type: 'string', example: '100 Technology Way, San Jose CA' },
                  createDeal: { type: 'boolean', default: true },
                  dealName: { type: 'string', example: 'Acme Enterprise License' },
                  dealValue: { type: 'number', example: 25000 },
                  dealProbability: { type: 'number', example: 70 },
                  expectedClosingDate: { type: 'string', format: 'date', example: '2026-11-30' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Lead converted successfully' },
          400: { description: 'Lead already converted or invalid status' },
        },
      },
    },

    // --- CUSTOMER MANAGEMENT ---
    '/customers': {
      get: {
        tags: ['Customer Management'],
        summary: 'Get paginated list of customers with search and filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search across customer name, email, phone, and company' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Active', 'Inactive', 'Churned'] } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' }, description: 'User ID of assigned sales executive' },
          { name: 'originalLead', in: 'query', schema: { type: 'string' }, description: 'ID of original lead' },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' }, description: 'Sort field (e.g. name, -createdAt)' },
        ],
        responses: {
          200: { description: 'Customers retrieved successfully' },
        },
      },
      post: {
        tags: ['Customer Management'],
        summary: 'Create a new customer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string', example: 'Apex Logistics' },
                  email: { type: 'string', example: 'sales@apexlogistics.com' },
                  phone: { type: 'string', example: '+18005550300' },
                  company: { type: 'string', example: 'Apex Logistics Ltd' },
                  address: { type: 'string', example: '100 Industrial Parkway, Chicago IL' },
                  status: { type: 'string', example: 'Active' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Customer created successfully' },
        },
      },
    },
    '/customers/{id}': {
      get: {
        tags: ['Customer Management'],
        summary: 'Get customer by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Customer details retrieved' },
          404: { description: 'Customer not found' },
        },
      },
      put: {
        tags: ['Customer Management'],
        summary: 'Update customer details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  company: { type: 'string' },
                  address: { type: 'string' },
                  status: { type: 'string', enum: ['Active', 'Inactive', 'Churned'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Customer updated successfully' },
        },
      },
      delete: {
        tags: ['Customer Management'],
        summary: 'Delete customer',
        description: 'Admin and Sales Manager only.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Customer deleted successfully' },
          403: { description: 'Forbidden' },
        },
      },
    },

    // --- DEAL MANAGEMENT ---
    '/deals': {
      get: {
        tags: ['Deal Management'],
        summary: 'Get paginated sales deals with search and filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search across deal name and description' },
          { name: 'stage', in: 'query', schema: { type: 'string', enum: ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'] } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' }, description: 'User ID of assigned sales executive' },
          { name: 'customer', in: 'query', schema: { type: 'string' }, description: 'Customer ID' },
          { name: 'lead', in: 'query', schema: { type: 'string' }, description: 'Lead ID' },
          { name: 'minAmount', in: 'query', schema: { type: 'number' }, description: 'Minimum deal value' },
          { name: 'maxAmount', in: 'query', schema: { type: 'number' }, description: 'Maximum deal value' },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' }, description: 'Sort field (e.g. value, -createdAt, stage)' },
        ],
        responses: {
          200: { description: 'Deals list retrieved successfully' },
        },
      },
      post: {
        tags: ['Deal Management'],
        summary: 'Create a new sales deal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'customer', 'value', 'expectedClosingDate'],
                properties: {
                  name: { type: 'string', example: 'Enterprise Software Expansion' },
                  customer: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d2' },
                  lead: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
                  value: { type: 'number', example: 50000 },
                  probability: { type: 'number', example: 80 },
                  expectedClosingDate: { type: 'string', format: 'date', example: '2026-12-15' },
                  stage: { type: 'string', example: 'Qualification' },
                  description: { type: 'string', example: 'Expansion module for CRM' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Deal created successfully' },
        },
      },
    },
    '/deals/{id}': {
      get: {
        tags: ['Deal Management'],
        summary: 'Get deal details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deal details retrieved' },
          404: { description: 'Deal not found' },
        },
      },
      put: {
        tags: ['Deal Management'],
        summary: 'Update deal details and stage',
        description: 'Enforces stage transition rules and requires lostReason when setting stage to Lost.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' },
                  probability: { type: 'number' },
                  stage: { type: 'string', enum: ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
                  lostReason: { type: 'string', example: 'Competitor offered lower pricing' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Deal updated successfully' },
          400: { description: 'Validation error (e.g. missing lostReason)' },
        },
      },
      delete: {
        tags: ['Deal Management'],
        summary: 'Delete deal',
        description: 'Admin and Sales Manager only.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deal deleted successfully' },
          403: { description: 'Forbidden' },
        },
      },
    },

    // --- ACTIVITY MANAGEMENT ---
    '/activities': {
      get: {
        tags: ['Activity Management'],
        summary: 'Get paginated list of activities with search and filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search across activity title and description' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Completed', 'Overdue'] } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['Call', 'Email', 'Meeting', 'Demo', 'Follow-up', 'Reminder', 'Note'] } },
          { name: 'entityType', in: 'query', schema: { type: 'string', enum: ['Lead', 'Customer', 'Deal', 'User'] } },
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' }, description: 'User ID of assigned executive' },
          { name: 'isOverdue', in: 'query', schema: { type: 'boolean' }, description: 'Filter for activities that are past due date' },
          { name: 'sort', in: 'query', schema: { type: 'string', default: 'dueDate' }, description: 'Sort field (e.g. dueDate, -createdAt)' },
        ],
        responses: {
          200: { description: 'Activities list retrieved successfully' },
        },
      },
      post: {
        tags: ['Activity Management'],
        summary: 'Create a new sales activity/follow-up',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'title', 'dueDate', 'entityType', 'entityId'],
                properties: {
                  type: { type: 'string', example: 'Call' },
                  title: { type: 'string', example: 'Initial Discovery Call' },
                  description: { type: 'string', example: 'Discuss project requirements' },
                  dueDate: { type: 'string', format: 'date-time', example: '2026-10-15T10:00:00Z' },
                  entityType: { type: 'string', example: 'Lead' },
                  entityId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Activity created successfully' },
        },
      },
    },
    '/activities/{id}': {
      get: {
        tags: ['Activity Management'],
        summary: 'Get activity details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Activity details fetched' },
          404: { description: 'Activity not found' },
        },
      },
      put: {
        tags: ['Activity Management'],
        summary: 'Update activity details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  dueDate: { type: 'string' },
                  status: { type: 'string', enum: ['Pending', 'Completed', 'Overdue'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Activity updated successfully' },
        },
      },
      delete: {
        tags: ['Activity Management'],
        summary: 'Delete activity',
        description: 'Admin and Sales Manager only.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Activity deleted successfully' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/activities/{id}/complete': {
      patch: {
        tags: ['Activity Management'],
        summary: 'Mark activity as completed',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Activity marked as completed successfully' },
          404: { description: 'Activity not found' },
        },
      },
    },

    // --- TIMELINE AUDIT ---
    '/timeline/{entityType}/{entityId}': {
      get: {
        tags: ['Timeline Audit'],
        summary: 'Get chronological activity timeline log for an entity',
        parameters: [
          { name: 'entityType', in: 'path', required: true, schema: { type: 'string', enum: ['Lead', 'Customer', 'Deal', 'User'] } },
          { name: 'entityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Timeline events retrieved successfully' },
        },
      },
    },

    // --- DASHBOARD & ANALYTICS ---
    '/dashboard/overview': {
      get: {
        tags: ['Dashboard & Analytics'],
        summary: 'Get overall sales statistics & metrics',
        description: 'Returns total leads, new leads, qualified leads, converted leads, deal totals, revenues, conversion rates, and activity stats.',
        responses: {
          200: { description: 'Sales overview metrics fetched successfully' },
        },
      },
    },
    '/dashboard/pipeline': {
      get: {
        tags: ['Dashboard & Analytics'],
        summary: 'Get sales pipeline stage breakdown',
        description: 'Returns deal count, total value, and expected revenue broken down by sales stage.',
        responses: {
          200: { description: 'Pipeline stage breakdown fetched successfully' },
        },
      },
    },
    '/dashboard/team-performance': {
      get: {
        tags: ['Dashboard & Analytics'],
        summary: 'Get team sales performance metrics',
        description: 'Admin and Sales Manager only. Returns breakdown of assigned leads, deals, won revenue, and win rate % per sales executive.',
        responses: {
          200: { description: 'Team performance metrics fetched successfully' },
          403: { description: 'Forbidden' },
        },
      },
    },

    // --- CRM CONFIGURATION ---
    '/config': {
      get: {
        tags: ['CRM Configuration'],
        summary: 'Get CRM configuration & system settings',
        description: 'Retrieve current CRM settings, default pipeline stages, currency, and default probabilities.',
        responses: {
          200: { description: 'CRM configuration fetched successfully' },
        },
      },
      put: {
        tags: ['CRM Configuration'],
        summary: 'Update CRM configuration & settings (Admin only)',
        description: 'Admin only. Updates system settings, currency, company name, default pipeline stages, etc.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  companyName: { type: 'string', example: 'Odisha CRM Solutions' },
                  currency: { type: 'string', example: 'USD' },
                  timezone: { type: 'string', example: 'UTC' },
                  leadSources: { type: 'array', items: { type: 'string' } },
                  leadStatuses: { type: 'array', items: { type: 'string' } },
                  dealStages: { type: 'array', items: { type: 'string' } },
                  allowExecutiveLeadReassignment: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'CRM configuration updated successfully' },
          403: { description: 'Forbidden: Admin role required' },
        },
      },
    },
  },
};

export { swaggerUi };

