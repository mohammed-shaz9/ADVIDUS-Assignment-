import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth, API_URL } from '../contexts/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useAdmin } from '../hooks/useAdmin';
import { createSocket } from '../utils/socket';
import { AppLayout } from '../components/layout/AppLayout';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { AIInsightCard } from '../components/dashboard/AIInsightCard';
import { WeeklyChart } from '../components/dashboard/WeeklyChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { UserManagementTable } from '../components/dashboard/UserManagementTable';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { TaskMonitorTable } from '../components/tasks/TaskMonitorTable';
import { UserTable } from '../components/users/UserTable';
import { AgentFormModal } from '../components/agents/AgentFormModal';
import { AgentConsoleModal } from '../components/agents/AgentConsoleModal';
import { ActivityLogTable } from '../components/activity/ActivityLogTable';
import { OrganizationPage } from './OrganizationPage';
import { ApprovalsPage } from './ApprovalsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { PerformancePage } from './PerformancePage';
import { TabType, Task } from '../types';

const DashboardPage: React.FC = () => {
  const { user, token, logout, addToast } = useAuth();
  const isAdmin = user?.role === 'admin';

  const {
    tasks: userTasks, taskSummary, agents: activeAgents, loading: loadingTasks,
    fetchTasks: fetchUserTasks, fetchTaskSummary, fetchActiveAgents,
    createTask, updateTask, deleteTask,
  } = useTasks();

  const {
    users: adminUsers, tasks: adminTasks, logs: adminLogs, agents: adminAgents,
    analytics, metrics, loading: loadingAdmin, fetchAllAdminData, fetchMetrics, fetchAnalytics,
    toggleUserStatus, deleteUser, forceDeleteTask,
    createAgent, toggleAgentStatus, deleteAgent,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<TabType>(isAdmin ? 'dashboard' : 'tasks');

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Session guard
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          logout();
          addToast('Session terminated.', 'error');
          return;
        }
        const data = await response.json();
        if (data.status === 'inactive') {
          logout();
          addToast('Account deactivated by administrator.', 'error');
        }
      } catch {
        // silent
      }
    };

    checkUserStatus();
    const interval = setInterval(checkUserStatus, 30000);
    return () => clearInterval(interval);
  }, [token, logout, addToast]);

  // Initial data fetch
  useEffect(() => {
    fetchUserTasks();
    fetchTaskSummary();
    fetchActiveAgents();
    if (isAdmin) {
      fetchAllAdminData();
    }
  }, [isAdmin, fetchUserTasks, fetchTaskSummary, fetchActiveAgents, fetchAllAdminData]);

  // WebSocket for admin real-time
  useEffect(() => {
    if (!token || !isAdmin) return;
    const socket = createSocket(API_URL, token);
    const refresh = () => fetchMetrics();
    const events = ['connect', 'task.created', 'task.updated', 'task.deleted',
      'user.status_changed', 'agent.created', 'agent.status_changed',
      'agent.deleted', 'activity.created'];
    events.forEach(e => socket.on(e, refresh));
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, isAdmin, fetchMetrics]);

  // Polling
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchTaskSummary, 5000);
    return () => clearInterval(interval);
  }, [token, fetchTaskSummary]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [token, isAdmin, fetchMetrics]);

  // DnD state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    (e.currentTarget as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
    (e.currentTarget as HTMLElement).classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    const task = userTasks.find(t => t._id === taskId);
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

    if (success && isAdmin) fetchAllAdminData();
  };

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTask, setConsoleTask] = useState<Task | null>(null);

  // Search/filter state
  const [taskSearch, setTaskSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [monitorSearch, setMonitorSearch] = useState('');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('all');

  const myTasksFiltered = useMemo(() => {
    return userTasks.filter(t => {
      const q = taskSearch.toLowerCase();
      return t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q));
    });
  }, [userTasks, taskSearch]);

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    fetchActiveAgents();
    setIsTaskModalOpen(true);
  };

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

    if (success) {
      setIsTaskModalOpen(false);
      if (isAdmin) fetchAllAdminData();
    }
  };

  const handleDeleteTaskAction = async (taskId: string) => {
    if (!window.confirm('Erase this task permanently?')) return;
    const success = await deleteTask(taskId);
    if (success && isAdmin) fetchAllAdminData();
  };

  const openConsole = (task: Task) => {
    setConsoleTask(task);
    setIsConsoleOpen(true);
  };

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
    if (success) {
      addToast('AI Agent execution rebooted', 'info');
      if (isAdmin) fetchAllAdminData();
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'users': return 'User Directory Management';
      case 'org': return 'Organization Structure';
      case 'tasks': return isAdmin ? 'Global Task Monitor' : 'Widescreen Kanban Board';
      case 'approvals': return 'Approval Workflows';
      case 'activity': return 'Security Audit Streams';
      case 'analytics': return 'Analytics & Insights';
      case 'performance': return 'Performance Scoring';
      case 'settings': return 'Enterprise Console Settings';
      default: return '';
    }
  };

  return (
    <>
      <AppLayout
        user={user!}
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
              tasks={adminTasks}
              currentUserId={user!._id}
              onToggleStatus={toggleUserStatus}
              onDeleteUser={deleteUser}
              onViewAll={() => handleTabChange('users')}
            />
          </div>
        )}

        {activeTab === 'users' && isAdmin && (
          <UserTable
            users={adminUsers}
            currentUserId={user!._id}
            search={userSearch}
            statusFilter={userStatusFilter}
            onSearchChange={setUserSearch}
            onStatusFilterChange={setUserStatusFilter}
            onToggleStatus={toggleUserStatus}
            onDelete={deleteUser}
          />
        )}

        {activeTab === 'tasks' && (
          <div className="animate-slide-up">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="view-label">
                  {isAdmin ? 'Personal Task Board' : 'Focused Taskboard Workspace'}
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                  <i className="ti ti-plus" style={{ marginRight: '6px' }}></i> Create Task
                </button>
              </div>

              <KanbanBoard
                tasks={myTasksFiltered}
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
                  tasks={adminTasks}
                  search={monitorSearch}
                  statusFilter={monitorStatusFilter}
                  onSearchChange={setMonitorSearch}
                  onStatusFilterChange={setMonitorStatusFilter}
                  onOpenConsole={openConsole}
                  onForceDelete={forceDeleteTask}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && isAdmin && (
          <ActivityLogTable
            logs={adminLogs}
            search={logSearch}
            actionFilter={logActionFilter}
            onSearchChange={setLogSearch}
            onActionFilterChange={setLogActionFilter}
          />
        )}

        {activeTab === 'org' && isAdmin && <OrganizationPage />}
        {activeTab === 'approvals' && isAdmin && <ApprovalsPage />}
        {activeTab === 'analytics' && isAdmin && <AnalyticsPage />}
        {activeTab === 'performance' && isAdmin && <PerformancePage />}

        {activeTab === 'settings' && (
          <div className="panel animate-slide-up">
            <div className="panel-header">
              <span className="panel-title">Enterprise Console Settings</span>
            </div>
            <div className="panel-body" style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Account Information</label>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.8 }}>
                  <div><strong>Name:</strong> {user?.name}</div>
                  <div><strong>Email:</strong> {user?.email}</div>
                  <div><strong>Role:</strong> {user?.role}</div>
                  <div><strong>Status:</strong> {user?.status}</div>
                </div>
              </div>
              <div style={{ marginTop: '24px' }}>
                <button className="btn-secondary" onClick={handleLogout}>
                  <i className="ti ti-logout" style={{ marginRight: '6px' }}></i> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
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
