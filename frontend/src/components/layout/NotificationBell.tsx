import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, API_URL } from '../../contexts/AuthContext';
import { notificationsApi } from '../../services/api';
import type { Notification as AppNotification } from '../../types';

export const NotificationBell: React.FC = () => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await notificationsApi.getAll();
      if (res.success && res.data) {
        setNotifications(res.data.slice(0, 10));
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      task_assigned: 'ti ti-user-plus',
      task_updated: 'ti ti-edit',
      approval_requested: 'ti ti-circle-check',
      approval_decided: 'ti ti-thumb-up',
      comment_added: 'ti ti-message',
      status_change: 'ti ti-arrows-shuffle',
      system: 'ti ti-bell',
    };
    return icons[type] || 'ti ti-bell';
  };

  return (
    <div className="notification-bell" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen(!open)}>
        <i className="ti ti-bell"></i>
        {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>Mark all read</button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`notification-item ${n.read ? '' : 'unread'}`}
                  onClick={() => !n.read && handleMarkAsRead(n._id)}
                >
                  <div className="notif-icon"><i className={getIcon(n.type)}></i></div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  {!n.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
