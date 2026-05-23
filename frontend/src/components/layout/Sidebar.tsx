import React from 'react';
import { User, TabType } from '../../types';

interface SidebarProps {
  user: User;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onTabChange, onLogout }) => {
  const navItems: Array<{ tab: TabType; label: string; icon: string; adminOnly?: boolean }> = [
    { tab: 'dashboard', label: 'Dashboard', icon: 'ti ti-layout-dashboard', adminOnly: true },
    { tab: 'tasks', label: 'Tasks', icon: 'ti ti-checklist' },
    { tab: 'users', label: 'Users', icon: 'ti ti-users', adminOnly: true },
    { tab: 'templates', label: 'Templates', icon: 'ti ti-files', adminOnly: true },
    { tab: 'org', label: 'Organization', icon: 'ti ti-building-community', adminOnly: true },
    { tab: 'approvals', label: 'Approvals', icon: 'ti ti-circle-check', adminOnly: true },
    { tab: 'activity', label: 'Audit Log', icon: 'ti ti-activity', adminOnly: true },
    { tab: 'analytics', label: 'Analytics', icon: 'ti ti-chart-bar', adminOnly: true },
    { tab: 'performance', label: 'Performance', icon: 'ti ti-trending-up', adminOnly: true },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-icon"><i className="ti ti-bolt" aria-hidden="true"></i></div>
        <span className="logo-text"><i>Advidus</i></span>
      </div>

      <div className="nav-section">
        <div className="nav-label">Main</div>
        {navItems
          .filter(item => !item.adminOnly || user.role === 'admin')
          .map(item => (
            <div
              key={item.tab}
              className={`nav-item ${activeTab === item.tab ? 'active' : ''}`}
              onClick={() => onTabChange(item.tab)}
            >
              <i className={item.icon} aria-hidden="true"></i>
              {item.label}
            </div>
          ))}
      </div>

      <div className="nav-section" style={{ marginTop: '8px' }}>
        <div className="nav-label">System</div>
        <div
          className={`nav-item ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => onTabChange('integrations')}
        >
          <i className="ti ti-plug" aria-hidden="true"></i> Integrations
        </div>
        <div
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
        >
          <i className="ti ti-settings" aria-hidden="true"></i> Settings
        </div>
        <div className="nav-itemlogout nav-item" onClick={onLogout} style={{ color: 'var(--accent-rose)' }}>
          <i className="ti ti-logout" aria-hidden="true"></i> Logout
        </div>
      </div>

      <div className="sidebar-bottom">
        <div className="user-pill">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <i className="ti ti-dots-vertical" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)' }} aria-hidden="true"></i>
        </div>
      </div>
    </div>
  );
};
