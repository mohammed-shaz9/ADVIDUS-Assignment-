import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null); // stores task object when editing
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('Pending');
  const [editLoading, setEditLoading] = useState(false);

  // Filter state
  const [filter, setFilter] = useState('All'); // 'All' | 'Pending' | 'Completed'

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTasks();
      if (response.data.success) {
        setTasks(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setError('');
      setCreateLoading(true);
      const response = await createTask({ title, description });
      if (response.data.success) {
        setTasks((prevTasks) => [response.data.data, ...prevTasks]);
        setTitle('');
        setDescription('');
      } else {
        setError(response.data.message || 'Failed to create task');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating task');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    try {
      const response = await updateTask(task._id, { status: newStatus });
      if (response.data.success) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === task._id ? response.data.data : t))
        );
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await deleteTask(id);
      if (response.data.success) {
        setTasks((prevTasks) => prevTasks.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete task');
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStatus(task.status);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      setEditLoading(true);
      const response = await updateTask(editingTask._id, {
        title: editTitle,
        description: editDescription,
        status: editStatus,
      });

      if (response.data.success) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === editingTask._id ? response.data.data : t))
        );
        cancelEditing();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save task modifications');
    } finally {
      setEditLoading(false);
    }
  };

  // Filter tasks based on selected state
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'Pending') return task.status === 'Pending';
    if (filter === 'Completed') return task.status === 'Completed';
    return true;
  });

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem 3rem 2rem',
      width: '100%',
    }}>
      {/* Header section */}
      <div className="glass-panel animate-fade-in" style={{
        padding: '2rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Hello, <span className="gradient-text">{user?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Here are your tasks and workflows.
          </p>
        </div>

        {/* Task filtering */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
          {['All', 'Pending', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="btn btn-sm"
              style={{
                background: filter === tab ? 'var(--primary)' : 'transparent',
                color: filter === tab ? 'white' : 'var(--text-secondary)',
                boxShadow: filter === tab ? '0 4px 10px var(--primary-glow)' : 'none',
                padding: '0.35rem 1rem',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--danger)',
          padding: '1rem',
          fontSize: '0.9rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* Main Grid: Form Left, Tasks Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        alignItems: 'start',
      }}>
        {/* Left Side: Create Task / Edit Task panel */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', position: 'sticky', top: '7rem' }}>
          {editingTask ? (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                Modify <span className="gradient-text">Task</span>
              </h3>
              <form onSubmit={handleUpdateTask}>
                <div className="input-group">
                  <label className="input-label" htmlFor="edit-title">Task Title</label>
                  <input
                    id="edit-title"
                    type="text"
                    className="input-field"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="E.g. Refactor API routes"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="edit-desc">Description</label>
                  <textarea
                    id="edit-desc"
                    className="input-field"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Details about this task..."
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    className="input-field"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={editLoading}>
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={cancelEditing} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                Create New <span className="gradient-text">Task</span>
              </h3>
              <form onSubmit={handleCreateTask}>
                <div className="input-group">
                  <label className="input-label" htmlFor="new-title">Task Title</label>
                  <input
                    id="new-title"
                    type="text"
                    className="input-field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Write unit tests"
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" htmlFor="new-desc">Description</label>
                  <textarea
                    id="new-desc"
                    className="input-field"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details about this task..."
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={createLoading}>
                  {createLoading ? 'Creating...' : '+ Create Task'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Task Listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                No tasks found.
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {filter === 'All'
                  ? 'Start by creating your first task on the left panel.'
                  : `No tasks matched the filter "${filter}".`}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                className="glass-card animate-fade-in"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  borderLeft: task.status === 'Completed' ? '4px solid var(--success)' : '4px solid var(--warning)',
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                  {/* Status checkbox */}
                  <div style={{ marginTop: '0.2rem' }}>
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => handleToggleStatus(task)}
                      style={{
                        width: '20px',
                        height: '20px',
                        accentColor: 'var(--success)',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  
                  {/* Task details */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '1.1rem',
                      marginBottom: '0.3rem',
                      textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                      color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                    }}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                      }}>
                        {task.description}
                      </p>
                    )}
                    <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span className={`badge ${task.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`}>
                        {task.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Created {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task controls */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => startEditing(task)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.4rem 0.6rem' }}
                    title="Edit Task"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.4rem 0.6rem' }}
                    title="Delete Task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
