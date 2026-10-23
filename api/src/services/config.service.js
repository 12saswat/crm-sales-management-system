import { CrmConfig } from '../models/CrmConfig.js';

export const getConfig = async () => {
  let config = await CrmConfig.findOne({ isDefault: true }).populate('updatedBy', 'name email role');
  if (!config) {
    config = await CrmConfig.create({ isDefault: true });
  }
  return config;
};

export const updateConfig = async (updateData, currentUser) => {
  let config = await CrmConfig.findOne({ isDefault: true });
  if (!config) {
    config = await CrmConfig.create({ isDefault: true });
  }

  delete updateData.isDefault;
  delete updateData._id;

  Object.assign(config, updateData);
  config.updatedBy = currentUser._id;
  await config.save();

  return await config.populate('updatedBy', 'name email role');
};

export const ConfigService = {
  getConfig,
  updateConfig,
};
