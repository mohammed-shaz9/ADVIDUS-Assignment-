import TaskTemplate from '../models/TaskTemplate.js';
import Task from '../models/Task.js';
import { logActivity } from '../utils/activityLogger.js';
import { NotFoundError } from '../errors/AppError.js';

export const getTemplates = async (onlyActive = false) => {
  const filter = onlyActive ? { isActive: true } : {};
  return TaskTemplate.find(filter).populate('createdBy', 'name email').sort({ name: 1 });
};

export const getTemplate = async (id: string) => {
  const template = await TaskTemplate.findById(id).populate('createdBy', 'name email');
  if (!template) throw new NotFoundError('TaskTemplate');
  return template;
};

export const createTemplate = async (data: Record<string, unknown>, userId: string) => {
  const template = await TaskTemplate.create({ ...data, createdBy: userId });
  await logActivity(userId, 'TASK_CREATED', `Created task template "${data.name}"`);
  return template;
};

export const updateTemplate = async (id: string, data: Record<string, unknown>, userId: string) => {
  const template = await TaskTemplate.findByIdAndUpdate(id, { ...data, $inc: { version: 1 } }, { new: true });
  if (!template) throw new NotFoundError('TaskTemplate');
  await logActivity(userId, 'TASK_UPDATED', `Updated task template "${template.name}"`);
  return template;
};

export const deleteTemplate = async (id: string, userId: string) => {
  const template = await TaskTemplate.findByIdAndDelete(id);
  if (!template) throw new NotFoundError('TaskTemplate');
  await logActivity(userId, 'TASK_DELETED', `Deleted task template "${template.name}"`);
  return { message: 'Template deleted' };
};

export const generateTasksFromTemplate = async (templateId: string, assigneeId: string, userId: string) => {
  const template = await TaskTemplate.findById(templateId);
  if (!template) throw new NotFoundError('TaskTemplate');

  const task = await Task.create({
    title: template.defaultTitle || template.name,
    description: template.defaultDescription || template.description,
    priority: template.defaultPriority,
    owner: assigneeId,
    assignedTo: { assigneeType: 'human', user: assigneeId },
  });

  await logActivity(userId, 'TASK_CREATED', `Generated task "${task.title}" from template "${template.name}"`);
  return task;
};
