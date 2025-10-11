// app/org/[orgId]/inbox/page.tsx  
// Currently this shows conversations, but should ALSO have a notifications/alerts tab

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export default function OrgInboxPage({ params }: { params: { orgId: string } }) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'notifications'>('conversations');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('org_id', params.orgId)
        .order('created_at', { ascending: false });

      query = query.or(`role_target.eq.${profile.role},role_target.eq.all`);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('org_id', params.orgId)
        .eq('is_read', false);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      campaign_completed: '📧',
      campaign_sent: '📤',
      brand_verified: '✅',
      brand_submitted: '⏳',
      import_completed: '📊',
      payment_received: '💳',
      billing_update: '💵',
      system_alert: '⚠️',
      member_added: '👥',
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      brand_verified: 'border-green-500',
      campaign_completed: 'border-blue-500',
      system_alert: 'border-yellow-500',
      payment_received: 'border-purple-500',
    };
    return colors[type] || 'border-gray-300';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="page">
      <h1 className="page-title">Inbox</h1>

      {/* Tab Navigation */}
      <div className="tabbar mb-6">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`btn ${activeTab === 'conversations' ? 'btn-primary' : ''}`}
        >
          Conversations
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`btn ${activeTab === 'notifications' ? 'btn-primary' : ''}`}
        >
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Conversations Tab (existing functionality) */}
      {activeTab === 'conversations' && (
        <div className="card">
          <p className="text-muted-foreground text-center py-8">
            Conversations view - existing functionality should remain here
          </p>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <>
          {/* Controls */}
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`btn ${filter === 'unread' ? 'btn-primary' : ''}`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="btn"
              >
                Mark All as Read
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="card text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-muted-foreground">
                  {filter === 'unread' ? '🎉 You\'re all caught up!' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`card border-l-4 ${
                    !notification.is_read 
                      ? getNotificationColor(notification.type)
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className={`font-semibold ${!notification.is_read ? '' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-2">{notification.message}</p>
                      
                      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                        <div className="text-sm bg-gray-50 rounded p-3 mt-2">
                          {notification.metadata.campaign_id && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Campaign:</span>
                              <a 
                                href={`/org/${params.orgId}/calendar?campaign=${notification.metadata.campaign_id}`}
                                className="text-blue-600 hover:underline"
                              >
                                View Details
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
