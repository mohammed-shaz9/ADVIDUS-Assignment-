import SystemSetting from '../models/SystemSetting.js';
import { NotFoundError } from '../errors/AppError.js';

const defaults = [
  { key: 'app_name', value: 'Advidus Task Manager', group: 'general', description: 'Application display name' },
  { key: 'app_timezone', value: 'UTC', group: 'general', description: 'Default timezone' },
  { key: 'items_per_page', value: '25', group: 'general', description: 'Default pagination size' },
  { key: 'task_default_priority', value: 'medium', group: 'tasks', description: 'Default priority for new tasks' },
  { key: 'task_auto_archive_days', value: '90', group: 'tasks', description: 'Days before completed tasks are archived' },
  { key: 'approval_required', value: 'true', group: 'tasks', description: 'Require approval for task completion' },
  { key: 'notification_task_assigned', value: 'true', group: 'notifications', description: 'Notify when task is assigned' },
  { key: 'notification_task_overdue', value: 'true', group: 'notifications', description: 'Notify when task becomes overdue' },
  { key: 'session_timeout_minutes', value: '60', group: 'security', description: 'Session timeout in minutes' },
  { key: 'max_login_attempts', value: '5', group: 'security', description: 'Max failed login attempts before lockout' },
  { key: 'integration_twilio', value: 'connected', group: 'integrations', description: 'Twilio WhatsApp API status' },
  { key: 'integration_groq', value: 'connected', group: 'integrations', description: 'Groq AI API status' },
  { key: 'integration_email', value: 'connected', group: 'integrations', description: 'Email service status' },
  { key: 'integration_redis', value: 'connected', group: 'integrations', description: 'Redis cache status' },
];

export const seedDefaults = async () => {
  for (const setting of defaults) {
    const existing = await SystemSetting.findOne({ key: setting.key });
    if (!existing) {
      await SystemSetting.create(setting);
    }
  }
};

export const getAllSettings = async (group?: string) => {
  const filter = group ? { group } : {};
  return SystemSetting.find(filter).sort({ group: 1, key: 1 });
};

export const getSetting = async (key: string) => {
  const setting = await SystemSetting.findOne({ key });
  if (!setting) throw new NotFoundError(`Setting "${key}"`);
  return setting;
};

export const updateSetting = async (key: string, value: string, userId: string) => {
  const setting = await SystemSetting.findOneAndUpdate(
    { key },
    { value, updatedBy: userId },
    { new: true }
  );
  if (!setting) throw new NotFoundError(`Setting "${key}"`);
  return setting;
};

export const getIntegrations = async () => {
  const integrations = await SystemSetting.find({ group: 'integrations' });
  return integrations.map(s => ({
    name: s.key.replace('integration_', ''),
    status: s.value as 'connected' | 'disconnected' | 'error',
    description: s.description,
  }));
};
