import React from 'react';
import { User } from '../../types';
import { NotificationBell } from './NotificationBell';

interface TopbarProps {
  user: User;
  pageTitle: string;
  pageSub: string;
}

export const Topbar: React.FC<TopbarProps> = ({ user, pageTitle, pageSub }) => {
  return (
    <div className="topbar">
      <div>
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
