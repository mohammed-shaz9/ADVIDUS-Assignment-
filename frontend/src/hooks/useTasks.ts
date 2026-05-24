import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tasksApi, agentsApi } from '../services/api';
import { Task, TaskSummary, Agent } from '../types';
import { cache } from '../utils/cache';

export const useTasks = () => {
  const { token, addToast } = useAuth();

  const [tasks, setTasks] = useState<Task[]>(cache.getArray<Task>('tasks'));
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(cache.get<TaskSummary>('taskSummary'));
  const [agents, setAgents] = useState<Agent[]>(cache.getArray<Agent>('agents'));
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await tasksApi.getAll();
      if (response.success && response.data) {
        setTasks(response.data);
        cache.set('tasks', response.data);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, addToast]);

  const fetchTaskSummary = useCallback(async () => {
    if (!token) return;
    try {
      const response = await tasksApi.getSummary();
      if (response.success && response.data) {
        setTaskSummary(response.data);
        cache.set('taskSummary', response.data);
      }
    } catch {
      // silent
    }
  }, [token]);

  const fetchActiveAgents = useCallback(async () => {
    if (!token) return;
    try {
      const response = await agentsApi.getAll();
      if (response.success && response.data) {
        setAgents(response.data);
        cache.set('agents', response.data);
      }
    } catch {
      // silent
    }
  }, [token]);

  const createTask = useCallback(async (title: string, description?: string, assignedTo?: Record<string, unknown>) => {
    if (!token) return false;
    try {
      const response = await tasksApi.create(title, description, assignedTo);
      if (response.success) {
        addToast('Task created successfully', 'success');
        await fetchTasks();
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create task', 'error');
      return false;
    }
  }, [token, addToast, fetchTasks]);

  const updateTask = useCallback(async (taskId: string, data: Partial<Task>) => {
    if (!token) return false;
    try {
      const response = await tasksApi.update(taskId, data);
      if (response.success) {
        addToast('Task updated successfully', 'success');
        await fetchTasks();
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update task', 'error');
      return false;
    }
  }, [token, addToast, fetchTasks]);

  const toggleTaskStatus = useCallback(async (task: Task) => {
    if (!token) return false;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const response = await tasksApi.update(task._id, { status: newStatus as Task['status'] });
      if (response.success) {
        addToast(
          newStatus === 'completed' ? 'Task completed!' : 'Task reset to pending',
          newStatus === 'completed' ? 'success' : 'info'
        );
        await fetchTasks();
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
      return false;
    }
  }, [token, addToast, fetchTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!token) return false;
    try {
      const response = await tasksApi.delete(taskId);
      if (response.success) {
        addToast('Task deleted successfully', 'success');
        await fetchTasks();
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete task', 'error');
      return false;
    }
  }, [token, addToast, fetchTasks]);

  return {
    tasks, taskSummary, agents, loading,
    fetchTasks, fetchTaskSummary, fetchActiveAgents,
    createTask, updateTask, toggleTaskStatus, deleteTask,
  };
};

export default useTasks;
