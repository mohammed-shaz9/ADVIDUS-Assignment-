import React, { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { SystemSetting } from '../types';

const groups = [
  { key: 'general', label: 'General', icon: 'ti ti-settings' },
  { key: 'tasks', label: 'Tasks', icon: 'ti ti-checklist' },
  { key: 'notifications', label: 'Notifications', icon: 'ti ti-bell' },
  { key: 'security', label: 'Security', icon: 'ti ti-shield' },
];

export const SettingsPage: React.FC = () => {
  const { addToast } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [activeGroup, setActiveGroup] = useState('general');
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async (group: string) => {
    setLoading(true);
    try {
      const res = await settingsApi.getAll(group);
      if (res.success && res.data) {
        setSettings(res.data);
        const vals: Record<string, string> = {};
        res.data.forEach(s => { vals[s.key] = s.value });
        setEditValues(vals);
      }
    } catch { addToast('Failed to load settings', 'error') }
    finally { setLoading(false) }
  }, [addToast]);

  useEffect(() => { fetchSettings(activeGroup) }, [activeGroup, fetchSettings]);

  const handleSave = async (key: string) => {
    try {
      await settingsApi.update(key, editValues[key]);
      addToast('Setting updated', 'success');
    } catch { addToast('Failed to update setting', 'error') }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2><i className="ti ti-settings"></i> System Settings</h2>
      </div>
      <div className="settings-layout" style={{ display: 'flex', gap: '24px' }}>
        <div className="settings-nav" style={{ width: '220px', flexShrink: 0 }}>
          {groups.map(g => (
            <div
              key={g.key}
              className={`settings-nav-item ${activeGroup === g.key ? 'active' : ''}`}
              onClick={() => setActiveGroup(g.key)}
            >
              <i className={g.icon}></i> {g.label}
            </div>
          ))}
        </div>
        <div className="settings-content" style={{ flex: 1 }}>
          {loading ? <div className="page-loading"><div className="spinner"></div></div> : (
            <div className="card">
              <div className="card-header"><h3>{groups.find(g => g.key === activeGroup)?.label} Settings</h3></div>
              <div className="card-body">
                {settings.length === 0 ? (
                  <p className="text-muted">No settings in this group</p>
                ) : (
                  settings.map(s => (
                    <div key={s.key} className="setting-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{s.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</div>
                        {s.description && <div className="text-muted" style={{ fontSize: '12px' }}>{s.description}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {editValues[s.key] === 'true' || editValues[s.key] === 'false' ? (
                          <label className="toggle-switch">
                            <input type="checkbox" checked={editValues[s.key] === 'true'} onChange={e => { setEditValues({...editValues, [s.key]: e.target.checked ? 'true' : 'false' }); setTimeout(() => handleSave(s.key), 100) }} />
                            <span className="toggle-slider"></span>
                          </label>
                        ) : (
                          <>
                            <input
                              value={editValues[s.key] || ''}
                              onChange={e => setEditValues({...editValues, [s.key]: e.target.value})}
                              style={{ width: '180px', textAlign: 'right' }}
                              onKeyDown={e => e.key === 'Enter' && handleSave(s.key)}
                            />
                            <button className="btn btn-sm btn-primary" onClick={() => handleSave(s.key)}>Save</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
