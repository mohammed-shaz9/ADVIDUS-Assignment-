import React from 'react';
import { User } from '../../types';

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
        <span className="badge-admin">{user.role}</span>
        <div className="icon-btn" title="Notifications">
          <i className="ti ti-bell" aria-hidden="true"></i>
        </div>
        <div className="icon-btn" title="Search">
          <i className="ti ti-search" aria-hidden="true"></i>
        </div>
      </div>
    </div>
  );
};
