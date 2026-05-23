import React from 'react';

interface StatCardProps {
  icon: string;
  iconBg: string;
  value: number | string;
  label: string;
  change: string;
  changeUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, value, label, change, changeUp }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: iconBg }}><i className={icon} aria-hidden="true"></i></div>
    <div className="stat-val">{value}</div>
    <div className="stat-label">{label}</div>
    <div className={`stat-change ${changeUp ? 'up' : 'down'}`}>
      <i className={`ti ti-arrow-${changeUp ? 'up' : 'down'}`} style={{ fontSize: '10px' }} aria-hidden="true"></i>
      {change}
    </div>
  </div>
);

interface StatsGridProps {
  totalUsers: number;
  activeUsers: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  totalUsers, activeUsers, completedTasks, pendingTasks, inProgressTasks, completionRate,
}) => (
  <div className="stats-grid">
    <StatCard
      icon="ti ti-users" iconBg="#6C63FF"
      value={totalUsers} label="Total users"
      change={`${activeUsers} Active`} changeUp
    />
    <StatCard
      icon="ti ti-circle-check" iconBg="#22C55E"
      value={completedTasks} label="Completed tasks"
      change={`${completionRate}% Rate`} changeUp
    />
    <StatCard
      icon="ti ti-clock" iconBg="#F59E0B"
      value={pendingTasks} label="Pending tasks"
      change="Requires balance"
    />
    <StatCard
      icon="ti ti-loader" iconBg="#EF4444"
      value={inProgressTasks} label="In progress"
      change="Autopilot active" changeUp
    />
  </div>
);
