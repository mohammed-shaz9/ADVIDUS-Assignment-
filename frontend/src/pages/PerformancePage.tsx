import React, { useEffect, useState } from 'react';
import { performanceApi } from '../services/api';
import { PerformanceScore } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const PerformancePage: React.FC = () => {
  const [scores, setScores] = useState<PerformanceScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadScores(); }, []);

  const loadScores = async () => {
    try {
      const res = await performanceApi.getAllPerformance();
      setScores(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner message="Loading performance data..." />;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + s.performance.score, 0) / scores.length) : 0;
  const topScorers = [...scores].sort((a, b) => b.performance.score - a.performance.score).slice(0, 3);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Performance Scores</h2>
        <button className="btn-primary btn-sm" onClick={async () => { await performanceApi.takeSnapshot(); loadScores(); }}>
          <i className="ti ti-refresh" style={{ marginRight: 6 }}></i> Refresh Snapshot
        </button>
      </div>

      {scores.length > 0 && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}><i className="ti ti-users"></i></div>
            <div className="stat-val">{scores.length}</div>
            <div className="stat-label">Employees Scored</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}><i className="ti ti-trending-up"></i></div>
            <div className="stat-val">{avgScore}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}><i className="ti ti-crown"></i></div>
            <div className="stat-val" style={{ fontSize: 14 }}>{topScorers.map(s => s.user.name.split(' ')[0]).join(', ')}</div>
            <div className="stat-label">Top Performers</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {scores.map((item, i) => {
          const perf = item.performance;
          const color = getScoreColor(perf.score);
          return (
            <div className="card" key={item.user._id || i}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.user.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(item.user as any).designation || item.user.role}</div>
                  </div>
                  <div style={{ position: 'relative', width: 56, height: 56 }}>
                    <svg width="56" height="56" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
                        strokeDasharray={`${perf.score * 0.942}, 100`}
                        strokeLinecap="round" transform="rotate(-90 18 18)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color }}>{perf.score}</div>
                  </div>
                </div>
                <div className="perf-metrics" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="metric"><div className="metric-value">{perf.tasksAssigned}</div><div className="metric-label">Assigned</div></div>
                  <div className="metric"><div className="metric-value">{perf.tasksCompleted}</div><div className="metric-label">Completed</div></div>
                  <div className="metric"><div className="metric-value">{perf.overdueTasks}</div><div className="metric-label">Overdue</div></div>
                  <div className="metric"><div className="metric-value">{perf.onTimeCompletion}</div><div className="metric-label">On Time</div></div>
                </div>
                <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(perf.score, 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {scores.length === 0 && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No performance data yet. Click "Refresh Snapshot" to calculate scores.</div></div>
      )}
    </div>
  );
};
