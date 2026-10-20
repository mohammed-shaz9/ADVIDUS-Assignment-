import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useAdmin } from '../hooks/useAdmin';
import { useVisibleInterval } from '../hooks/useVisibleInterval';
import { useSocketRefetch } from '../hooks/useSocketRefetch';
import { AppLayout } from '../components/layout/AppLayout';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { AIInsightCard } from '../components/dashboard/AIInsightCard';
import { WeeklyChart } from '../components/dashboard/WeeklyChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { UserManagementTable } from '../components/dashboard/UserManagementTable';
import { PersonalTaskSummary } from '../components/dashboard/PersonalTaskSummary';
import { DepartmentStats } from '../components/dashboard/DepartmentStats';
import { TeamActivityFeed } from '../components/dashboard/TeamActivityFeed';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { TaskMonitorTable } from '../components/tasks/TaskMonitorTable';
import { UserTable } from '../components/users/UserTable';
import { AgentFormModal } from '../components/agents/AgentFormModal';
import { AgentConsoleModal } from '../components/agents/AgentConsoleModal';
import { ActivityLogTable } from '../components/activity/ActivityLogTable';
import { orgApi } from '../services/api';
import { TabType, Task, DeptStats } from '../types';

const OrganizationPage = React.lazy(() => import('./OrganizationPage').then(m => ({ default: m.OrganizationPage })));
const ApprovalsPage = React.lazy(() => import('./ApprovalsPage').then(m => ({ default: m.ApprovalsPage })));
const AnalyticsPage = React.lazy(() => import('./AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const PerformancePage = React.lazy(() => import('./PerformancePage').then(m => ({ default: m.PerformancePage })));
const TemplatesPage = React.lazy(() => import('./TemplatesPage').then(m => ({ default: m.TemplatesPage })));
const SettingsPage = React.lazy(() => import('./SettingsPage').then(m => ({ default: m.SettingsPage })));
const IntegrationsPage = React.lazy(() => import('./IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));

const TASK_EVENTS = ['task.created', 'task.updated', 'task.deleted'];
const ADMIN_TASK_EVENTS = [...TASK_EVENTS, 'agent.created', 'agent.status_changed', 'agent.deleted'];
const ACTIVITY_EVENTS = ['activity.created'];
const USER_EVENTS = ['user.status_changed'];
const FALLBACK_REFRESH_MS = 60_000; // sockets are primary; this only covers missed events

const PageSkeleton: React.FC = () => (
  <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
    <div className="skeleton-shimmer" style={{ height: 24, width: '40%', margin: '0 auto 16px', borderRadius: 6, background: '#1e1e2e' }} />
    <div className="skeleton-shimmer" style={{ height: 16, width: '60%', margin: '0 auto 12px', borderRadius: 4, background: '#1e1e2e' }} />
    <div className="skeleton-shimmer" style={{ height: 200, width: '100%', borderRadius: 8, background: '#1e1e2e' }} />
  </div>
);

const LazyPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={<PageSkeleton />}>{children}</React.Suspense>
);

const DashboardPage: React.FC = () => {
  const { user, token, logout, addToast } = useAuth();
  const isAdmin = user?.role === 'admin';

  const {
    tasks: userTasks, taskSummary, agents: activeAgents, loading: loadingTasks,
    fetchTasks: fetchUserTasks, fetchTaskSummary, fetchActiveAgents,
    createTask, updateTask, deleteTask,
  } = useTasks();

  const {
    users: adminUsers, logs: adminLogs,
    analytics, metrics, loading: loadingAdmin, error: adminError, fetchAllAdminData, fetchMetrics,
    fetchUsers, fetchLogs,
    toggleUserStatus, deleteUser, forceDeleteTask,
    createAgent, toggleAgentStatus, deleteAgent,
  } = useAdmin();

  const TAB_PATHS: Record<string, TabType> = {
    '/dashboard': 'dashboard', '/tasks': 'tasks', '/users': 'users',
    '/activity': 'activity', '/org': 'org', '/approvals': 'approvals',
    '/performance': 'performance', '/analytics': 'analytics',
    '/templates': 'templates', '/settings': 'settings', '/integrations': 'integrations',
  };
  const PATH_TO_TAB: Record<TabType, string> = {
    dashboard: '/dashboard', tasks: '/tasks', users: '/users',
    activity: '/activity', org: '/org', approvals: '/approvals',
    performance: '/performance', analytics: '/analytics',
    templates: '/templates', settings: '/settings', integrations: '/integrations',
  };

  const getTabFromPath = useCallback(() => {
    const tab = TAB_PATHS[window.location.pathname];
    if (tab) return tab;
    if (!isAdmin) return 'tasks';
    return 'dashboard';
  }, [isAdmin]);

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromPath());

  useEffect(() => {
    const onPop = () => setActiveTab(getTabFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [getTabFromPath]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    const url = PATH_TO_TAB[tab] || '/dashboard';
    window.history.pushState(null, '', url);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Employee widgets: own department headcount + own recent activity (server-scoped; no user list is sent).
  const [deptStats, setDeptStats] = useState<DeptStats | null>(null);
  const [deptLoading, setDeptLoading] = useState(!isAdmin);
  const fetchDept = useCallback(async () => {
    try {
      const res = await orgApi.getMyDepartment();
      if (res.success) setDeptStats(res.data ?? null);
    } catch {
      // widget stays on its last value
    } finally {
      setDeptLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchUserTasks();
    fetchTaskSummary();
    fetchActiveAgents();
    if (!isAdmin) {
      fetchLogs();
      fetchDept();
    }
  }, [fetchUserTasks, fetchTaskSummary, fetchActiveAgents, isAdmin, fetchLogs, fetchDept]);

  // Admin dashboard slices are only needed (and refreshed) while that tab is open.
  const onDashboard = isAdmin && activeTab === 'dashboard';
  useEffect(() => {
    if (onDashboard) fetchAllAdminData();
  }, [onDashboard, fetchAllAdminData]);

  // Realtime: coalesced refetch of only the slice an event affects.
  // Server delivers just the events that concern this user (admins get everything).
  const refreshMyTasks = useCallback(() => { fetchUserTasks(); fetchTaskSummary(); }, [fetchUserTasks, fetchTaskSummary]);
  useSocketRefetch(TASK_EVENTS, refreshMyTasks);
  useSocketRefetch(ADMIN_TASK_EVENTS, fetchMetrics, 1500, onDashboard);
  useSocketRefetch(ACTIVITY_EVENTS, fetchLogs, 1500, onDashboard || !isAdmin);
  useSocketRefetch(USER_EVENTS, fetchUsers, 1500, onDashboard);

  // Fallback refresh: paused while tab hidden, refires on focus.
  useVisibleInterval(() => {
    fetchTaskSummary();
    fetchUserTasks();
    if (onDashboard) fetchAllAdminData();
    if (!isAdmin) { fetchLogs(); fetchDept(); }
  }, FALLBACK_REFRESH_MS, !!token);

  // DnD state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    (e.currentTarget as HTMLElement).classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
    (e.currentTarget as HTMLElement).classList.remove('dragging');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverColumn(null), []);

  // Latest values for the stable drop handler below
  const userTasksRef = useRef(userTasks);
  const draggingRef = useRef(draggingTaskId);
  useEffect(() => { userTasksRef.current = userTasks; draggingRef.current = draggingTaskId; });

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingRef.current;
    if (!taskId) return;

    const task = userTasksRef.current.find(t => t._id === taskId);
    if (!task || task.status === targetStatus) return;

    const success = await updateTask(task._id, {
      ...task,
      status: targetStatus as Task['status'],
      assignedTo: task.assignedTo ? {
        assigneeType: task.assignedTo.assigneeType,
        user: typeof task.assignedTo.user === 'object' ? (task.assignedTo.user as { _id: string })._id : task.assignedTo.user,
        agent: typeof task.assignedTo.agent === 'object' ? (task.assignedTo.agent as { _id: string })._id : task.assignedTo.agent,
      } as any : undefined,
    } as any);

    return success;
  }, [updateTask]);

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTask, setConsoleTask] = useState<Task | null>(null);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    fetchActiveAgents();
    setIsTaskModalOpen(true);
  }, [fetchActiveAgents]);

  const openCreateModal = () => {
    setEditingTask(null);
    fetchActiveAgents();
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskForm = async (data: { title: string; description: string; assigneeType: string; selectedAgentId: string }) => {
    const delegation = {
      assigneeType: data.assigneeType,
      user: data.assigneeType === 'human' ? user?._id : undefined,
      agent: data.assigneeType === 'agent' ? data.selectedAgentId || undefined : undefined,
    };

    let success: boolean;
    if (editingTask) {
      success = await updateTask(editingTask._id, {
        title: data.title,
        description: data.description,
        assignedTo: delegation as any,
      } as any);
    } else {
      success = await createTask(data.title, data.description, delegation);
    }

    if (success) setIsTaskModalOpen(false);
  };

  const handleDeleteTaskAction = useCallback(async (taskId: string) => {
    if (!window.confirm('Erase this task permanently?')) return;
    await deleteTask(taskId);
  }, [deleteTask]);

  const openConsole = useCallback((task: Task) => {
    setConsoleTask(task);
    setIsConsoleOpen(true);
  }, []);

  // userId -> total tasks, from the analytics top-N (no client-side scan of task lists)
  const taskCounts = useMemo(() => {
    const m: Record<string, number> = {};
    analytics?.userTaskStats?.forEach(u => { m[u._id] = u.totalTasks; });
    return m;
  }, [analytics]);

  const triggerRerun = async () => {
    if (!consoleTask) return;
    setIsConsoleOpen(false);
    const delegation = {
      assigneeType: consoleTask.assignedTo?.assigneeType,
      agent: typeof consoleTask.assignedTo?.agent === 'object'
        ? (consoleTask.assignedTo.agent as { _id: string })._id
        : consoleTask.assignedTo?.agent,
    };
    const success = await updateTask(consoleTask._id, {
      ...consoleTask,
      status: 'pending',
      assignedTo: delegation as any,
    } as any);
    if (success) addToast('AI Agent execution rebooted', 'info');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'users': return 'User Management';
      case 'org': return 'Org Structure';
      case 'tasks': return 'Task Management';
      case 'approvals': return 'Workflow Engine';
      case 'activity': return 'Audit & Compliance';
      case 'analytics': return 'Reporting & Analytics';
      case 'performance': return 'Performance';
      case 'templates': return 'Template Manager';
      case 'integrations': return 'Master Data';
      case 'settings': return 'Identity & Access';
      default: return '';
    }
  };

  return (
    <>
      <AppLayout
        user={user!}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        pageTitle={getPageTitle()}
      >
        {activeTab === 'dashboard' && isAdmin && (
          <div className="animate-slide-up">
            <StatsGrid
              totalUsers={metrics?.counts.users.total || analytics?.users.total || 0}
              activeUsers={metrics?.counts.users.active || analytics?.users.active || 0}
              completedTasks={metrics?.counts.tasks.completed || taskSummary?.counts.completed || analytics?.tasks.completed || 0}
              pendingTasks={metrics?.counts.tasks.pending || taskSummary?.counts.pending || analytics?.tasks.pending || 0}
              inProgressTasks={metrics?.counts.tasks.in_progress || taskSummary?.counts.in_progress || analytics?.tasks.inProgress || 0}
              completionRate={analytics?.tasks.completionRate || 0}
            />
            <AIInsightCard
              completionRate={analytics?.tasks.completionRate || 0}
              pendingTasks={analytics?.tasks.pending || 0}
            />
            <div className="two-col animate-slide-up">
              <WeeklyChart tasks={userTasks} />
              <ActivityFeed logs={adminLogs} onViewAll={() => handleTabChange('activity')} />
            </div>
            <UserManagementTable
              users={adminUsers}
              taskCounts={taskCounts}
              currentUserId={user!._id}
              loading={loadingAdmin}
              error={adminError}
              onRetry={fetchAllAdminData}
              onToggleStatus={toggleUserStatus}
              onDeleteUser={deleteUser}
              onViewAll={() => handleTabChange('users')}
            />
          </div>
        )}

        {activeTab === 'users' && isAdmin && (
          <UserTable
            currentUserId={user!._id}
            onToggleStatus={toggleUserStatus}
            onDelete={deleteUser}
          />
        )}

        {activeTab === 'tasks' && (
          <div className="animate-slide-up">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {isAdmin ? 'Personal Task Board' : 'My Workspace'}
                  </div>
                  {!isAdmin && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Your personal task dashboard
                    </div>
                  )}
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                  <i className="ti ti-plus" style={{ marginRight: '6px' }}></i> Create Task
                </button>
              </div>

              {!isAdmin && (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(108,99,255,0.08) 0%, rgba(108,99,255,0.02) 100%)',
                    border: '0.5px solid rgba(108,99,255,0.2)',
                    borderRadius: 'var(--radius-md)', padding: '20px 22px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: 'rgba(108,99,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="ti ti-user" style={{ fontSize: '24px', color: '#6C63FF' }}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Welcome back, {user?.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Here's your personal task overview.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                        <i className="ti ti-clock"></i>
                      </div>
                      <div className="stat-val">{taskSummary?.counts.pending || 0}</div>
                      <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.12)', color: '#6C63FF' }}>
                        <i className="ti ti-progress-check"></i>
                      </div>
                      <div className="stat-val">{taskSummary?.counts.in_progress || 0}</div>
                      <div className="stat-label">In Progress</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                        <i className="ti ti-check"></i>
                      </div>
                      <div className="stat-val">{taskSummary?.counts.completed || 0}</div>
                      <div className="stat-label">Completed</div>
                     </div>
                   </div>
                 </>
               )}

               {/* Employee-specific widgets - Personal Dashboard */}
                {!isAdmin && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <PersonalTaskSummary 
                      tasks={userTasks} 
                      loading={loadingTasks}
                    />
                    <DepartmentStats
                      stats={deptStats}
                      loading={deptLoading}
                    />
                    <TeamActivityFeed 
                      logs={adminLogs} 
                      currentUserId={user?._id || ''}
                      loading={loadingAdmin}
                    />
                  </div>
                )}

               <KanbanBoard
                tasks={userTasks}
                draggingTaskId={draggingTaskId}
                dragOverColumn={dragOverColumn}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onEdit={openEditModal}
                onDelete={handleDeleteTaskAction}
                onOpenConsole={openConsole}
              />

              {isAdmin && (
                <TaskMonitorTable
                  onOpenConsole={openConsole}
                  onForceDelete={forceDeleteTask}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && isAdmin && (
          <ActivityLogTable />
        )}

        {activeTab === 'org' && isAdmin && <LazyPage key="org"><OrganizationPage /></LazyPage>}
        {activeTab === 'approvals' && isAdmin && <LazyPage key="approvals"><ApprovalsPage /></LazyPage>}
        {activeTab === 'analytics' && <LazyPage key="analytics"><AnalyticsPage /></LazyPage>}
        {activeTab === 'performance' && <LazyPage key="performance"><PerformancePage /></LazyPage>}
        {activeTab === 'templates' && isAdmin && <LazyPage key="templates"><TemplatesPage /></LazyPage>}
        {activeTab === 'integrations' && isAdmin && <LazyPage key="integrations"><IntegrationsPage /></LazyPage>}
        {activeTab === 'settings' && <LazyPage key="settings"><SettingsPage /></LazyPage>}
      </AppLayout>

      <TaskFormModal
        isOpen={isTaskModalOpen}
        editingTask={editingTask}
        agents={activeAgents}
        onSave={handleSaveTaskForm}
        onClose={() => setIsTaskModalOpen(false)}
      />

      <AgentFormModal
        isOpen={isAgentModalOpen}
        onSave={async (data) => {
          const success = await createAgent(data.name, data.role, data.systemPrompt, data.modelName);
          if (success) setIsAgentModalOpen(false);
        }}
        onClose={() => setIsAgentModalOpen(false)}
      />

      <AgentConsoleModal
        isOpen={isConsoleOpen}
        task={consoleTask}
        onClose={() => setIsConsoleOpen(false)}
        onRerun={triggerRerun}
      />
    </>
  );
};

export default DashboardPage;
