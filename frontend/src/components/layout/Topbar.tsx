import React from 'react';
import { User, TabType } from '../../types';
import { NotificationBell } from './NotificationBell';

interface TopbarProps {
  user: User;
  pageTitle: string;
  pageSub: string;
  activeTab: TabType;
}

const breadcrumbNames: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Task Management',
  users: 'User Management',
  templates: 'Template Manager',
  org: 'Org Structure',
  approvals: 'Workflow Engine',
  activity: 'Audit & Compliance',
  analytics: 'Reporting & Analytics',
  performance: 'Performance',
  settings: 'Identity & Access',
  integratons: 'Master Data',
};

export const Topbar: React.FC<TopbarProps> = ({ user, pageTitle, pageSub, activeTab }) => {
  return (
    <div className="topbar">
      <div>
        <div className="breadcrumb">
          <img src="/logo.png" alt="Logo" style={{ height: '16px', borderRadius: '4px' }} />
          <span className="sep">/</span>
          <span>{breadcrumbNames[activeTab] || pageTitle}</span>
        </div>
        <div className="page-title">{pageTitle}</div>
        <div className="page-sub">{pageSub}</div>
      </div>
      <div className="topbar-actions">
        <NotificationBell />
        <span className="badge-admin">{user.role}</span>
      </div>
    </div>
  );
};
