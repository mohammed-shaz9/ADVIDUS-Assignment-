import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, agentsApi, tasksApi } from '../services/api';
import { User, Task, ActivityLog, Agent, Analytics, Metrics } from '../types';
import { cache } from '../utils/cache';

export const useAdmin = () => {
  const { token, user, addToast } = useAuth();

  // Hydrate from cache immediately, before any API call
  const cachedUsers = cache.get<User[]>('adminUsers');
  const [users, setUsers] = useState<User[]>(cachedUsers ?? []);
  const cachedTasks = cache.get<Task[]>('adminTasks');
  const [tasks, setTasks] = useState<Task[]>(cachedTasks ?? []);
  const cachedLogs = cache.get<ActivityLog[]>('adminLogs');
  const [logs, setLogs] = useState<ActivityLog[]>(cachedLogs ?? []);
  const cachedAgents = cache.get<Agent[]>('adminAgents');
  const [agents, setAgents] = useState<Agent[]>(cachedAgents ?? []);
  const cachedAnalytics = cache.get<Analytics>('adminAnalytics');
  const [analytics, setAnalytics] = useState<Analytics | null>(cachedAnalytics);
  const cachedMetrics = cache.get<Metrics>('adminMetrics');
  const [metrics, setMetrics] = useState<Metrics | null>(cachedMetrics);
  const [loading, setLoading] = useState(false);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    setRefreshingAnalytics(true);
    try {
      const response = await adminApi.getAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data);
        cache.set('adminAnalytics', response.data);
      }
    } catch (err) {
      addToast('Error loading analytics', 'error');
    } finally {
      setRefreshingAnalytics(false);
    }
  }, [token, user, addToast]);

  const fetchMetrics = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      const response = await adminApi.getMetrics();
      if (response.success && response.data) {
        setMetrics(response.data);
        cache.set('adminMetrics', response.data);
      }
    } catch {
      // silent
    }
  }, [token, user]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const response = await adminApi.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
        cache.set('adminUsers', response.data);
      }
    } catch {
      // silent
    }
  }, [token]);

  const fetchTasks = useCallback(async (params?: Record<string, string>) => {
    if (!token || user?.role !== 'admin') return;
    try {
      const response = await adminApi.getTasks(params);
      if (response.success && response.items) {
        setTasks(response.items as unknown as Task[]);
        cache.set('adminTasks', response.items as unknown as Task[]);
      }
    } catch {
      // silent
    }
  }, [token, user]);

  const fetchLogs = useCallback(async (params?: Record<string, string>) => {
    if (!token) return;
    try {
      const response = await adminApi.getLogs(params);
      if (response.success && response.items) {
        setLogs(response.items as unknown as ActivityLog[]);
        cache.set('adminLogs', response.items as unknown as ActivityLog[]);
      }
    } catch {
      // silent
    }
  }, [token]);

  const fetchAgents = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      const response = await agentsApi.getAll();
      if (response.success && response.data) {
        setAgents(response.data);
        cache.set('adminAgents', response.data);
      }
    } catch {
      // silent
    }
  }, [token, user]);

  const fetchAllAdminData = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    setLoading(true);
    try {
      // Use batched endpoint to reduce 6 calls to 1
      const response = await adminApi.getDashboard();
      if (response.success && response.data) {
        const { users: u, tasks: t, logs: l, metrics: m, analytics: a } = response.data;
        setUsers(u || []); cache.set('adminUsers', u || []);
        setTasks(t || []); cache.set('adminTasks', t || []);
        setLogs(l || []); cache.set('adminLogs', l || []);
        setMetrics(m || null); cache.set('adminMetrics', m);
        setAnalytics(a || null); cache.set('adminAnalytics', a);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const toggleUserStatus = useCallback(async (targetUserId: string) => {
    if (!token) return false;
    if (targetUserId === user?._id) {
      addToast('You cannot deactivate your own account!', 'error');
      return false;
    }
    try {
      const response = await adminApi.toggleUserStatus(targetUserId);
      if (response.success) {
        addToast('User status updated', 'success');
        await Promise.all([fetchUsers(), fetchAnalytics(), fetchLogs()]);
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to toggle status', 'error');
      return false;
    }
  }, [token, user, addToast, fetchUsers, fetchAnalytics, fetchLogs]);

  const deleteUser = useCallback(async (targetUserId: string, targetUserName: string) => {
    if (!token) return false;
    if (targetUserId === user?._id) {
      addToast('You cannot delete your own account!', 'error');
      return false;
    }
    try {
      const response = await adminApi.deleteUser(targetUserId);
      if (response.success) {
        addToast(`User "${targetUserName}" deleted`, 'success');
        await fetchAllAdminData();
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
      return false;
    }
  }, [token, user, addToast, fetchAllAdminData]);

  const forceDeleteTask = useCallback(async (taskId: string) => {
    if (!token) return false;
    try {
      const response = await tasksApi.delete(taskId);
      if (response.success) {
        addToast('Task deleted', 'success');
        await Promise.all([fetchTasks(), fetchAnalytics(), fetchLogs()]);
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete task', 'error');
      return false;
    }
  }, [token, addToast, fetchTasks, fetchAnalytics, fetchLogs]);

  const createAgent = useCallback(async (name: string, role: string, systemPrompt: string, modelName?: string) => {
    if (!token) return false;
    try {
      const response = await agentsApi.create({ name, role, systemPrompt, modelName });
      if (response.success) {
        addToast(`AI Agent "${name}" registered`, 'success');
        await Promise.all([fetchAgents(), fetchAnalytics(), fetchLogs()]);
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to register agent', 'error');
      return false;
    }
  }, [token, addToast, fetchAgents, fetchAnalytics, fetchLogs]);

  const toggleAgentStatus = useCallback(async (agentId: string) => {
    if (!token) return false;
    try {
      const response = await agentsApi.toggleStatus(agentId);
      if (response.success && response.data) {
        addToast(`Agent status set to ${response.data.status}`, 'success');
        await Promise.all([fetchAgents(), fetchAnalytics(), fetchLogs()]);
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to toggle agent status', 'error');
      return false;
    }
  }, [token, addToast, fetchAgents, fetchAnalytics, fetchLogs]);

  const deleteAgent = useCallback(async (agentId: string, agentName: string) => {
    if (!token) return false;
    try {
      const response = await agentsApi.delete(agentId);
      if (response.success) {
        addToast(`Agent "${agentName}" removed`, 'success');
        await Promise.all([fetchAgents(), fetchAnalytics(), fetchLogs()]);
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete agent', 'error');
      return false;
    }
  }, [token, addToast, fetchAgents, fetchAnalytics, fetchLogs]);

  return {
    users, tasks, logs, agents, analytics, metrics, loading, refreshingAnalytics,
    fetchAnalytics, fetchMetrics, fetchUsers, fetchTasks, fetchLogs, fetchAgents, fetchAllAdminData,
    toggleUserStatus, deleteUser, forceDeleteTask,
    createAgent, toggleAgentStatus, deleteAgent,
  };
};

export default useAdmin;
