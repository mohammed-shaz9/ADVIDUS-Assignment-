import React from 'react';
import { User, TabType } from '../../types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  user: User;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  pageTitle: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user, activeTab, onTabChange, onLogout, pageTitle, children,
}) => {
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="app">
      <Sidebar user={user} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />
      <div className="main">
        <Topbar user={user} pageTitle={pageTitle} pageSub={getFormattedDate()} />
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};
