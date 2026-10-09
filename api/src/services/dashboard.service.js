import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { Activity } from '../models/Activity.js';
import { User } from '../models/User.js';
import { applyRoleScope } from '../middleware/rbac.middleware.js';
import { LEAD_STATUSES, DEAL_STAGES, ACTIVITY_STATUSES, ROLES } from '../config/constants.js';


export const getOverviewMetrics = async (currentUser) => {
  const leadScope = applyRoleScope({ user: currentUser }, {}, 'assignedTo');
  const customerScope = applyRoleScope({ user: currentUser }, {}, 'assignedTo');
  const dealScope = applyRoleScope({ user: currentUser }, {}, 'assignedTo');
  const activityScope = applyRoleScope({ user: currentUser }, {}, 'assignedTo');

  const now = new Date();

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    convertedLeads,
    totalCustomers,
    totalDeals,
    openDeals,
    wonDeals,
    lostDeals,
    revenueAggregation,
    pendingActivities,
    overdueActivities,
  ] = await Promise.all([
    Lead.countDocuments(leadScope),
    Lead.countDocuments({ ...leadScope, status: LEAD_STATUSES.NEW }),
    Lead.countDocuments({ ...leadScope, status: LEAD_STATUSES.QUALIFIED }),
    Lead.countDocuments({ ...leadScope, status: LEAD_STATUSES.CONVERTED }),
    Customer.countDocuments(customerScope),
    Deal.countDocuments(dealScope),
    Deal.countDocuments({ ...dealScope, stage: { $nin: [DEAL_STAGES.WON, DEAL_STAGES.LOST] } }),
    Deal.countDocuments({ ...dealScope, stage: DEAL_STAGES.WON }),
    Deal.countDocuments({ ...dealScope, stage: DEAL_STAGES.LOST }),
    Deal.aggregate([
      { $match: dealScope },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$stage', DEAL_STAGES.WON] }, '$value', 0] },
          },
          expectedRevenue: {
            $sum: {
              $cond: [
                { $in: ['$stage', [DEAL_STAGES.WON, DEAL_STAGES.LOST]] },
                0,
                '$expectedRevenue',
              ],
            },
          },
        },
      },
    ]),
    Activity.countDocuments({ ...activityScope, status: ACTIVITY_STATUSES.PENDING }),
    Activity.countDocuments({
      ...activityScope,
      status: ACTIVITY_STATUSES.PENDING,
      dueDate: { $lt: now },
    }),
  ]);

  const totalRev = revenueAggregation[0]?.totalRevenue || 0;
  const expRev = revenueAggregation[0]?.expectedRevenue || 0;
  const conversionRate = totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0;

  return {
    leads: {
      total: totalLeads,
      new: newLeads,
      qualified: qualifiedLeads,
      converted: convertedLeads,
    },
    customers: {
      total: totalCustomers,
    },
    deals: {
      total: totalDeals,
      open: openDeals,
      won: wonDeals,
      lost: lostDeals,
    },
    revenue: {
      totalRevenue: totalRev,
      expectedRevenue: expRev,
    },
    performance: {
      conversionRatePercent: conversionRate,
    },
    activities: {
      pending: pendingActivities,
      overdue: overdueActivities,
    },
  };
};

export const getPipelineMetrics = async (currentUser) => {
  const dealScope = applyRoleScope({ user: currentUser }, {}, 'assignedTo');

  const pipelineData = await Deal.aggregate([
    { $match: dealScope },
    {
      $group: {
        _id: '$stage',
        dealCount: { $sum: 1 },
        totalValue: { $sum: '$value' },
        expectedRevenue: { $sum: '$expectedRevenue' },
      },
    },
  ]);

  const stages = Object.values(DEAL_STAGES);
  const result = stages.map((stage) => {
    const found = pipelineData.find((p) => p._id === stage);
    return {
      stage,
      dealCount: found ? found.dealCount : 0,
      totalValue: found ? found.totalValue : 0,
      expectedRevenue: found ? found.expectedRevenue : 0,
    };
  });

  return result;
};

export const getTeamPerformance = async (currentUser) => {
  const users = await User.find({ role: ROLES.SALES_EXECUTIVE, isActive: true }).select('name email role');

  const performance = await Promise.all(
    users.map(async (user) => {
      const userId = user._id;

      const [leadCount, dealStats, customerCount] = await Promise.all([
        Lead.countDocuments({ assignedTo: userId }),
        Deal.aggregate([
          { $match: { assignedTo: userId } },
          {
            $group: {
              _id: null,
              totalDeals: { $sum: 1 },
              wonDeals: { $sum: { $cond: [{ $eq: ['$stage', DEAL_STAGES.WON] }, 1, 0] } },
              totalRevenue: { $sum: { $cond: [{ $eq: ['$stage', DEAL_STAGES.WON] }, '$value', 0] } },
            },
          },
        ]),
        Customer.countDocuments({ assignedTo: userId }),
      ]);

      const stats = dealStats[0] || { totalDeals: 0, wonDeals: 0, totalRevenue: 0 };

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        assignedLeads: leadCount,
        assignedCustomers: customerCount,
        totalDeals: stats.totalDeals,
        wonDeals: stats.wonDeals,
        totalRevenue: stats.totalRevenue,
        winRate: stats.totalDeals > 0 ? parseFloat(((stats.wonDeals / stats.totalDeals) * 100).toFixed(2)) : 0,
      };
    })
  );

  return performance;
};

export const DashboardService = {
  getOverviewMetrics,
  getPipelineMetrics,
  getTeamPerformance,
};
