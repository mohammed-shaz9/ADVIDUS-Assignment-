import React, { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Integration } from '../types';

const statusIcons: Record<string, string> = {
  connected: 'ti ti-circle-check',
  disconnected: 'ti ti-circle-x',
  error: 'ti ti-alert-triangle',
};

const statusColors: Record<string, string> = {
  connected: 'var(--accent-green)',
  disconnected: 'var(--text-muted)',
  error: 'var(--accent-rose)',
};

const integrationIcons: Record<string, string> = {
  twilio: 'ti ti-message',
  groq: 'ti ti-brain',
  email: 'ti ti-mail',
  redis: 'ti ti-database',
};

export const IntegrationsPage: React.FC = () => {
  const { addToast } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await settingsApi.getIntegrations();
      if (res.success && res.data) setIntegrations(res.data);
    } catch { addToast('Failed to load integrations', 'error') }
    finally { setLoading(false) }
  }, [addToast]);

  useEffect(() => { fetchIntegrations() }, [fetchIntegrations]);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2><i className="ti ti-plug"></i> Integrations</h2>
      </div>
      <div className="integration-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {integrations.map(int => (
          <div key={int.name} className="card integration-card" style={{ cursor: 'default' }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                <i className={integrationIcons[int.name] || 'ti ti-plug'}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{int.name}</div>
                {int.description && <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>{int.description}</div>}
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className={statusIcons[int.status] || 'ti ti-circle'} style={{ color: statusColors[int.status] }}></i>
                  <span style={{ fontSize: '13px', color: statusColors[int.status], textTransform: 'capitalize' }}>{int.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
