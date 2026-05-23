import React, { useState, useEffect, useCallback } from 'react';
import { templatesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TaskTemplate } from '../types';

export const TemplatesPage: React.FC = () => {
  const { addToast } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', defaultTitle: '', defaultDescription: '', defaultPriority: 'medium', isRecurring: false, recurrenceRule: '', checklistSteps: '' });
  const [editing, setEditing] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await templatesApi.getAll();
      if (res.success && res.data) setTemplates(res.data);
    } catch { addToast('Failed to load templates', 'error') }
    finally { setLoading(false) }
  }, [addToast]);

  useEffect(() => { fetchTemplates() }, [fetchTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        name: formData.name,
        description: formData.description,
        defaultTitle: formData.defaultTitle || undefined,
        defaultDescription: formData.defaultDescription || undefined,
        defaultPriority: formData.defaultPriority,
        isRecurring: formData.isRecurring,
        recurrenceRule: formData.recurrenceRule || undefined,
        checklistSteps: formData.checklistSteps ? formData.checklistSteps.split('\n').filter(Boolean).map((t: string) => ({ text: t })) : [],
      };
      if (editing) {
        await templatesApi.update(editing, data);
        addToast('Template updated', 'success');
      } else {
        await templatesApi.create(data);
        addToast('Template created', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', description: '', defaultTitle: '', defaultDescription: '', defaultPriority: 'medium', isRecurring: false, recurrenceRule: '', checklistSteps: '' });
      fetchTemplates();
    } catch (err: any) {
      addToast(err.message || 'Failed to save template', 'error');
    }
  };

  const handleEdit = (t: TaskTemplate) => {
    setFormData({
      name: t.name,
      description: t.description || '',
      defaultTitle: t.defaultTitle || '',
      defaultDescription: t.defaultDescription || '',
      defaultPriority: t.defaultPriority,
      isRecurring: t.isRecurring,
      recurrenceRule: t.recurrenceRule || '',
      checklistSteps: t.checklistSteps.map(s => s.text).join('\n'),
    });
    setEditing(t._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await templatesApi.delete(id);
      addToast('Template deleted', 'info');
      fetchTemplates();
    } catch { addToast('Failed to delete template', 'error') }
  };

  const priorityClass = (p: string) => {
    const m: Record<string, string> = { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger', critical: 'badge-danger' };
    return m[p] || 'badge-info';
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2><i className="ti ti-files"></i> Task Templates</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setFormData({ name: '', description: '', defaultTitle: '', defaultDescription: '', defaultPriority: 'medium', isRecurring: false, recurrenceRule: '', checklistSteps: '' }); setShowForm(true); }}>
          <i className="ti ti-plus"></i> New Template
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <div className="card-header"><h3>{editing ? 'Edit Template' : 'New Template'}</h3></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Template Name *</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} />
            </div>
            <div className="form-group">
              <label>Default Title</label>
              <input value={formData.defaultTitle} onChange={e => setFormData({...formData, defaultTitle: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Default Priority</label>
              <select value={formData.defaultPriority} onChange={e => setFormData({...formData, defaultPriority: e.target.value})}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Default Description</label>
              <textarea value={formData.defaultDescription} onChange={e => setFormData({...formData, defaultDescription: e.target.value})} rows={2} />
            </div>
            <div className="form-group">
              <label><input type="checkbox" checked={formData.isRecurring} onChange={e => setFormData({...formData, isRecurring: e.target.checked})} /> Recurring</label>
            </div>
            {formData.isRecurring && (
              <div className="form-group">
                <label>Recurrence</label>
                <select value={formData.recurrenceRule} onChange={e => setFormData({...formData, recurrenceRule: e.target.value})}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Checklist Steps (one per line)</label>
              <textarea value={formData.checklistSteps} onChange={e => setFormData({...formData, checklistSteps: e.target.value})} rows={3} placeholder="Step 1&#10;Step 2&#10;Step 3" />
            </div>
          </div>
          <div className="card-footer">
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
            <button type="button" className="btn" onClick={() => setShowForm(false)} style={{ marginLeft: '8px' }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Priority</th>
              <th>Recurring</th>
              <th>Checklist</th>
              <th>Version</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr><td colSpan={7} className="text-center">No templates yet</td></tr>
            ) : templates.map(t => (
              <tr key={t._id}>
                <td><strong>{t.name}</strong>{t.description && <div className="text-muted" style={{fontSize:'12px'}}>{t.description}</div>}</td>
                <td><span className={`badge ${priorityClass(t.defaultPriority)}`}>{t.defaultPriority}</span></td>
                <td>{t.isRecurring ? <span className="badge badge-info">{t.recurrenceRule}</span> : '-'}</td>
                <td>{t.checklistSteps.length} steps</td>
                <td>v{t.version}</td>
                <td>{t.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => handleEdit(t)} title="Edit"><i className="ti ti-edit"></i></button>
                  <button className="btn btn-sm" onClick={() => handleDelete(t._id)} title="Delete" style={{color:'var(--accent-rose)'}}><i className="ti ti-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
