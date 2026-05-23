import React, { useState, useEffect, useCallback } from 'react';
import { User, TabType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { tasksApi } from '../../services/api';

interface SidebarProps {
  user: User;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onTabChange, onLogout }) => {
  const { token } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await tasksApi.getSummary();
      if (res.success && res.data) setPendingCount(res.data.counts.pending);
    } catch {}
  }, [token]);

  useEffect(() => { fetchPendingCount(); const interval = setInterval(fetchPendingCount, 10000); return () => clearInterval(interval); }, [fetchPendingCount]);

  const sections: Array<{
    title: string;
    items: Array<{ tab: TabType; label: string; icon: string; badge?: number; adminOnly?: boolean }>;
  }> = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { tab: 'dashboard', label: 'Dashboard', icon: 'ti ti-layout-grid', adminOnly: true },
        { tab: 'tasks', label: 'Task Management', icon: 'ti ti-checklist', badge: pendingCount },
        { tab: 'approvals', label: 'Workflow Engine', icon: 'ti ti-nodes', adminOnly: true },
        { tab: 'templates', label: 'Template Manager', icon: 'ti ti-files', adminOnly: true },
      ],
    },
    {
      title: 'ORGANIZATION',
      items: [
        { tab: 'users', label: 'User Management', icon: 'ti ti-users', adminOnly: true },
        { tab: 'org', label: 'Org Structure', icon: 'ti ti-building-community', adminOnly: true },
        { tab: 'settings', label: 'Identity & Access', icon: 'ti ti-shield' },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { tab: 'analytics', label: 'Reporting & Analytics', icon: 'ti ti-chart-bar', adminOnly: true },
        { tab: 'performance', label: 'Performance', icon: 'ti ti-trending-up' },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { tab: 'activity', label: 'Audit & Compliance', icon: 'ti ti-clock', adminOnly: true },
        { tab: 'integrations', label: 'Master Data', icon: 'ti ti-database', adminOnly: true },
      ],
    },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <img src="/logo.png" alt="Logo" className="logo-icon" />
        <div>
          <div className="logo-text">TaskFlow</div>
          <div className="logo-sub">Enterprise Platform</div>
        </div>
      </div>

      {sections.map((section) => (
        <div className="nav-section" key={section.title}>
          <div className="nav-section-title">{section.title}</div>
          {section.items
            .filter(item => !item.adminOnly || user.role === 'admin')
            .map((item) => (
              <div
                key={item.tab}
                className={`nav-item ${activeTab === item.tab ? 'active' : ''}`}
                onClick={() => onTabChange(item.tab)}
              >
                <i className={item.icon} aria-hidden="true"></i>
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="badge-count">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </div>
            ))}
        </div>
      ))}

      <div className="sidebar-bottom">
        <div className="user-pill">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role} · {user.role === 'admin' ? 'Executive' : 'Employee'}</div>
          </div>
          <i className="ti ti-logout" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }} onClick={onLogout}></i>
        </div>
      </div>
    </div>
  );
};
