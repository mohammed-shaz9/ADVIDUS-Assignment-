import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { adminApi } from '../services/api';
import { ExtendedAnalytics } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth, API_URL } from '../contexts/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

export const AnalyticsPage: React.FC = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<ExtendedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res.data || null);
    } catch {
      try {
        const res = await fetch(`${API_URL}/analytics`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setAnalytics(json.data);
      } catch {}
    } finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;
  if (!analytics) return <div className="page-container"><p>No data available.</p></div>;

  const { tasks, users } = analytics;

  const taskStatusData = {
    labels: ['Completed', 'Pending', 'In Progress'],
    datasets: [{
      data: [tasks.completed, tasks.pending, tasks.inProgress],
      backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6'],
      borderWidth: 0,
    }],
  };

  const userStatusData = {
    labels: ['Active', 'Inactive'],
    datasets: [{
      data: [users?.active ?? 0, users?.inactive ?? 0],
      backgroundColor: ['#22c55e', '#ef4444'],
      borderWidth: 0,
    }],
  };

  const userTaskData = {
    labels: (analytics.userTaskStats || []).map(u => u.name.split(' ')[0]),
    datasets: [
      { label: 'Total Tasks', data: (analytics.userTaskStats || []).map(u => u.totalTasks), backgroundColor: '#6366f1' },
      { label: 'Completed', data: (analytics.userTaskStats || []).map(u => u.completedTasks), backgroundColor: '#22c55e' },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: 'rgba(255,255,255,0.65)', font: { size: 11 } },
      },
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  return (
    <div className="page-container">
      <div className="page-header"><h2>Analytics Dashboard</h2></div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}><i className="ti ti-checklist"></i></div>
          <div className="stat-val">{tasks.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}><i className="ti ti-percentage"></i></div>
          <div className="stat-val">{tasks.completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}><i className="ti ti-users"></i></div>
          <div className="stat-val">{users?.total ?? 'N/A'}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}><i className="ti ti-clock"></i></div>
          <div className="stat-val">{tasks.pending}</div>
          <div className="stat-label">Pending Tasks</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><h3>Task Status Distribution</h3></div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: 220, height: 220 }}><Doughnut data={taskStatusData} /></div>
          </div>
        </div>
        {users ? (
          <div className="card">
            <div className="card-header"><h3>User Status</h3></div>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <div style={{ width: 220, height: 220 }}><Doughnut data={userStatusData} /></div>
            </div>
          </div>
        ) : null}
      </div>

      {(analytics.userTaskStats && analytics.userTaskStats.length > 0) ? (
        <div className="card">
          <div className="card-header"><h3>Tasks Per User</h3></div>
          <div className="card-body" style={{ padding: 20 }}>
            <Bar data={userTaskData} options={chartOptions} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
