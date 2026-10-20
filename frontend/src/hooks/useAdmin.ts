import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, agentsApi, tasksApi } from '../services/api';
import { User, ActivityLog, Agent, Analytics, Metrics } from '../types';
import { cache } from '../utils/cache';
import { useLatestSignal } from './useLatestSignal';

// Dashboard slices only (first pages). Full user / task / log lists are paged server-side
// inside UserTable, TaskMonitorTable and ActivityLogTable.
const PREVIEW_LIMIT = 10;

export const useAdmin = () => {
  const { token, user, addToast } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(cache.get<Metrics>('adminMetrics'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);

  const dashSignal = useLatestSignal();
  const analyticsSignal = useLatestSignal();
  const metricsSignal = useLatestSignal();
  const usersSignal = useLatestSignal();
  const logsSignal = useLatestSignal();

  const fetchAnalytics = useCallback(async () => {
    if (!token || !isAdmin) return;
    const signal = analyticsSignal();
    setRefreshingAnalytics(true);
    try {
      const response = await adminApi.getAnalytics(20, signal);
      if (signal.aborted) return;
      if (response.success && response.data) setAnalytics(response.data);
    } catch {
      if (!signal.aborted) addToast('Error loading analytics', 'error');
    } finally {
      if (!signal.aborted) setRefreshingAnalytics(false);
    }
  }, [token, isAdmin, addToast, analyticsSignal]);

  const fetchMetrics = useCallback(async () => {
    if (!token || !isAdmin) return;
    const signal = metricsSignal();
    try {
      const response = await adminApi.getMetrics(signal);
      if (signal.aborted) return;
      if (response.success && response.data) {
        setMetrics(response.data);
        cache.set('adminMetrics', response.data);
      }
    } catch {
      // silent
    }
  }, [token, isAdmin, metricsSignal]);

  const fetchUsers = useCallback(async () => {
    if (!token || !isAdmin) return;
    const signal = usersSignal();
    try {
      const response = await adminApi.getUsers({ page: 1, limit: PREVIEW_LIMIT }, signal);
      if (!signal.aborted && response.success) setUsers(response.items);
    } catch {
      // silent
    }
  }, [token, isAdmin, usersSignal]);

  // Non-admins are allowed: the server scopes the result to their own entries.
  const fetchLogs = useCallback(async () => {
    if (!token) return;
    const signal = logsSignal();
    try {
      const response = await adminApi.getLogs({ page: 1, limit: PREVIEW_LIMIT }, signal);
      if (!signal.aborted && response.success) setLogs(response.items);
    } catch {
      // silent
    }
  }, [token, logsSignal]);

  const fetchAgents = useCallback(async () => {
    if (!token || !isAdmin) return;
    try {
      const response = await agentsApi.getAll();
      if (response.success && response.data) setAgents(response.data);
    } catch {
      // silent
    }
  }, [token, isAdmin]);

  const fetchAllAdminData = useCallback(async () => {
    if (!token || !isAdmin) return;
    const signal = dashSignal();
    setLoading(true);
    try {
      const response = await adminApi.getDashboard(signal);
      if (signal.aborted) return;
      if (response.success && response.data) {
        const { users: u, logs: l, metrics: m, analytics: a } = response.data;
        setUsers(u?.items ?? []);
        setLogs(l?.items ?? []);
        setMetrics(m || null);
        if (m) cache.set('adminMetrics', m);
        setAnalytics(a || null);
        setError(null);
      }
    } catch (err) {
      if (!signal.aborted) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [token, isAdmin, dashSignal]);

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
        await Promise.all([fetchUsers(), fetchMetrics(), fetchAnalytics(), fetchLogs()]);
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to toggle status', 'error');
      return false;
    }
  }, [token, user, addToast, fetchUsers, fetchMetrics, fetchAnalytics, fetchLogs]);

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
        await Promise.all([fetchMetrics(), fetchAnalytics(), fetchLogs()]);
        return true;
      }
      return false;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete task', 'error');
      return false;
    }
  }, [token, addToast, fetchMetrics, fetchAnalytics, fetchLogs]);

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
    users, logs, agents, analytics, metrics, loading, error, refreshingAnalytics,
    fetchAnalytics, fetchMetrics, fetchUsers, fetchLogs, fetchAgents, fetchAllAdminData,
    toggleUserStatus, deleteUser, forceDeleteTask,
    createAgent, toggleAgentStatus, deleteAgent,
  };
};

export default useAdmin;
