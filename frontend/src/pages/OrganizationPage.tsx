import React, { useCallback, useEffect, useState } from 'react';
import { orgApi } from '../services/api';
import { Department, Designation } from '../types';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';

export const OrganizationPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'tree' | 'designations'>('tree');

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [deptRes, desigRes, chartRes] = await Promise.all([
        orgApi.getDepartments(signal),
        orgApi.getDesignations(undefined, signal),
        orgApi.getOrgChart(signal),
      ]);
      if (signal?.aborted) return;
      setDepartments(deptRes.data || []);
      setDesignations(desigRes.data || []);
      setDeptCounts(chartRes.data?.departmentCounts || {});
      setError(null);
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Failed to load organization');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctl = new AbortController();
    loadData(ctl.signal);
    return () => ctl.abort();
  }, [loadData]);

  const retry = () => { setLoading(true); setError(null); loadData(); };

  const renderDepartmentTree = (depts: Department[], level = 0) => (
    <ul style={{ paddingLeft: level > 0 ? 20 : 0, listStyle: 'none', margin: 0 }}>
      {depts.map(dept => (
        <li key={dept._id} style={{ margin: '4px 0' }}>
          <div className="org-node" style={{
            padding: '10px 14px', background: 'var(--bg-card)',
            borderRadius: 8, borderLeft: '3px solid var(--accent-indigo)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'rgba(108,99,255,0.12)', color: 'var(--accent-indigo)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, flexShrink: 0,
            }}><i className="ti ti-building"></i></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.name}</div>
              {dept.head && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Head: {dept.head.name}</div>}
            </div>
            <span className="badge badge--muted">{(deptCounts[dept._id] ?? 0).toLocaleString()} members</span>
            {!dept.isActive && <span className="badge badge--danger">Inactive</span>}
          </div>
          {dept.children && dept.children.length > 0 && renderDepartmentTree(dept.children, level + 1)}
        </li>
      ))}
    </ul>
  );

  if (loading) return <div className="page-container"><Skeleton height="48px" count={6} /></div>;
  if (error) return <div className="page-container"><ErrorState message={error} onRetry={retry} /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Organization Structure</h2>
        <div className="tab-bar">
          <button className={`btn btn-sm ${activeSection === 'tree' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSection('tree')}>Departments ({departments.length})</button>
          <button className={`btn btn-sm ${activeSection === 'designations' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSection('designations')}>Designations ({designations.length})</button>
        </div>
      </div>

      {activeSection === 'tree' && (
        <div className="card">
          <div className="card-header"><h3>Department Hierarchy</h3></div>
          <div className="card-body">
            {departments.filter(d => !d.parentId).length > 0
              ? renderDepartmentTree(departments.filter(d => !d.parentId))
              : <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No departments found.</div>
            }
          </div>
        </div>
      )}

      {activeSection === 'designations' && (
        <div className="card">
          <div className="card-header"><h3>Job Designations</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            {designations.length === 0 ? (
              <div className="empty-state">No designations found.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Title</th><th>Level</th><th>Department</th><th>Status</th></tr></thead>
                  <tbody>
                    {designations.map(d => (
                      <tr key={d._id}>
                        <td style={{ fontWeight: 500 }}>{d.title}</td>
                        <td><span className="badge badge--muted">L{d.level}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{d.department?.name || '—'}</td>
                        <td><span className={`badge ${d.isActive ? 'badge--success' : 'badge--danger'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
