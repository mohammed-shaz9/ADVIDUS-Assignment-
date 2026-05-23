import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { orgApi } from '../services/api';
import { Department, Designation, User } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const OrganizationPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'tree' | 'designations'>('tree');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deptRes, desigRes, chartRes] = await Promise.all([
        orgApi.getDepartments(),
        orgApi.getDesignations(),
        orgApi.getOrgChart(),
      ]);
      setDepartments(deptRes.data || []);
      setDesignations(desigRes.data || []);
      setUsers(chartRes.data?.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
            {!dept.isActive && <span className="badge badge-inactive">Inactive</span>}
          </div>
          {dept.children && dept.children.length > 0 && renderDepartmentTree(dept.children, level + 1)}
        </li>
      ))}
    </ul>
  );

  if (loading) return <LoadingSpinner message="Loading organization..." />;

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
            <table className="table">
              <thead><tr><th>Title</th><th>Level</th><th>Department</th><th>Status</th></tr></thead>
              <tbody>
                {designations.map(d => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 500 }}>{d.title}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>L{d.level}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{(d.department as any)?.name || '—'}</td>
                    <td><span className={`badge ${d.isActive ? 'badge-active' : 'badge-inactive'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
