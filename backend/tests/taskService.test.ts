import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/models/Task.js', () => ({ default: { findById: vi.fn() } }));
vi.mock('../src/utils/activityLogger.js', () => ({ logActivity: vi.fn() }));
vi.mock('../src/utils/agentExecutor.js', () => ({ executeAgentTask: vi.fn() }));
vi.mock('../src/utils/realtime.js', () => ({ emitEvent: vi.fn() }));
vi.mock('../src/services/notificationService.js', () => ({ createNotification: vi.fn() }));

import Task from '../src/models/Task.js';
import { createNotification } from '../src/services/notificationService.js';
import { updateTask } from '../src/services/taskService.js';

// First findById() resolves the doc; second (re-fetch after save) is the populate().populate() chain.
const mockTask = () => {
  const task: any = {
    _id: 'tk',
    owner: 'owner1',
    title: 'Old title',
    description: 'Old desc',
    status: 'pending',
    assignedTo: { assigneeType: 'human', user: 'assignee1' },
  };
  task.save = vi.fn().mockResolvedValue(task);
  const populated = vi.fn().mockResolvedValue({ _id: 'tk', status: 'x' });
  vi.mocked(Task.findById)
    .mockResolvedValueOnce(task)
    .mockReturnValueOnce({ populate: vi.fn(() => ({ populate: populated })) } as any);
  return task;
};

describe('taskService.updateTask RBAC', () => {
  beforeEach(() => vi.resetAllMocks()); // reset (not clear): unconsumed mockXOnce values must not leak

  it('404 when task missing', async () => {
    vi.mocked(Task.findById).mockResolvedValueOnce(null);
    await expect(updateTask('tk', 'owner1', 'user', {})).rejects.toMatchObject({ statusCode: 404 });
  });

  it('stranger gets ForbiddenError and nothing is saved', async () => {
    const task = mockTask();
    await expect(updateTask('tk', 'stranger', 'user', { title: 'Hacked' })).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('Not authorized'),
    });
    expect(task.title).toBe('Old title');
    expect(task.save).not.toHaveBeenCalled();
  });

  it('assignee: title/description/assignedTo silently dropped, status applied', async () => {
    const task = mockTask();
    await updateTask('tk', 'assignee1', 'user', {
      title: 'Hacked',
      description: 'Hacked',
      assignedTo: { assigneeType: 'human', user: 'assignee1', extra: 1 },
      status: 'in_progress',
    });
    expect(task.title).toBe('Old title');
    expect(task.description).toBe('Old desc');
    expect(task.assignedTo).toEqual({ assigneeType: 'human', user: 'assignee1' });
    expect(task.status).toBe('in_progress');
    expect(task.save).toHaveBeenCalled();
  });

  it('assignee status change notifies the owner', async () => {
    mockTask();
    await updateTask('tk', 'assignee1', 'user', { status: 'completed' });
    expect(createNotification).toHaveBeenCalledWith('owner1', 'status_change', 'Task Completed', expect.any(String), '/tasks/tk');
  });

  it('owner can edit title', async () => {
    const task = mockTask();
    await updateTask('tk', 'owner1', 'user', { title: 'New title' });
    expect(task.title).toBe('New title');
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('admin (neither owner nor assignee) can edit title', async () => {
    const task = mockTask();
    await updateTask('tk', 'admin1', 'admin', { title: 'Admin edit' });
    expect(task.title).toBe('Admin edit');
  });
});
