'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/utils/axiosInstance';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  // Handles null from service
  reportId?: string; 
  // Ensures the type field is read
  type?: 'CIVIC_REPORT_STATUS' | 'BID_ACCEPTED' | 'OTHER'; 
}

interface NotificationBellProps {
  userId: string;
}

const BellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const bellRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 1. ✅ FIX: DEFINE ALL FUNCTIONS HERE (AFTER STATE, BEFORE USEEFFECT)
  
  const fetchNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // Ensure this endpoint matches your NestJS controller: @Controller('notification')
      const response = await api.get('/notification', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedNotifications = response.data.sort((a: Notification, b: Notification) => {
          if (a.isRead !== b.isRead) {
              return a.isRead ? 1 : -1; // Unread (false) comes first
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/notification/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
        const token = localStorage.getItem('access_token');
        await api.post('/notification/read-all', {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNavigation = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    let path = null;

    switch (notification.type) {
        case 'CIVIC_REPORT_STATUS':
            if (notification.reportId) {
                path = `/auth/dashboard/citizen/civic-report?reportId=${notification.reportId}`;
            }
            break;
        
        case 'BID_ACCEPTED':
            path = `/auth/dashboard/marketplace/my-listings`; 
            break;
    }

    if (path) {
        router.push(path);
    }
    
    setIsOpen(false); 
  };
  
  const handleSendReply = async (notificationId: string) => {
      if (!replyText.trim()) return;

      // TODO: IMPLEMENT BACKEND API CALL TO SEND THE REPLY MESSAGE
      console.log(`Sending reply to ${notificationId}: ${replyText}`);
      
      markAsRead(notificationId);
      setReplyText('');
      setReplyingToId(null);
      setIsOpen(false); 
  }

  // 2. ✅ FIX: USEEFFECT CALLS FUNCTIONS NOW THAT THEY ARE DEFINED
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
    // fetchNotifications must be in dependency array if using React 18 strict mode
  }, [userId]);


  // Handles clicking outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setReplyingToId(null); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => {
            setIsOpen(!isOpen);
        }}
        className="relative p-2 rounded-full text-white hover:bg-gray-700/50 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-gray-900 bg-red-500 text-xs font-bold text-white flex items-center justify-center p-1">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel (Dropdown) */}
      {isOpen && (
        <>
          <div className="absolute right-0 mt-3 w-80 md:w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[100] transform transition-all animate-fade-in-down">
            <div className="p-3 flex justify-between items-center border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Notifications ({unreadCount} unread)</h3>
              {unreadCount > 0 && (
                <button
                    onClick={markAllAsRead}
                    className="text-xs text-green-400 hover:text-green-300 font-medium"
                >
                    Mark All Read
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-700">
              {loading && <p className="p-4 text-center text-gray-400">Loading...</p>}
              
              {!loading && notifications.length === 0 && (
                <p className="p-4 text-center text-gray-400">You're all caught up!</p>
              )}

              {!loading && notifications.length > 0 && (
                <>
                  {notifications.slice(0, 10).map((notification) => {
                    
                    const isMessageNotification = notification.type === 'OTHER' || !notification.type;
                    const canNavigate = !isMessageNotification;
                    const isReplying = replyingToId === notification.id;

                    return (
                        <div 
                          key={notification.id} 
                          className={`p-3 transition-colors ${
                            !notification.isRead ? 'bg-gray-700/50' : 'bg-gray-800'
                          } ${canNavigate ? 'cursor-pointer hover:bg-gray-700' : ''}`}
                          onClick={canNavigate ? () => handleNavigation(notification) : undefined}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-1 ${!notification.isRead ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <div className="flex-1">
                              <p className={`text-sm ${
                                !notification.isRead 
                                  ? 'text-white font-medium'
                                  : 'text-gray-400'
                              }`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Conditional Reply button / Form */}
                          {isMessageNotification && (
                              <div className="mt-2 text-right">
                                  {isReplying ? (
                                      <div onClick={e => e.stopPropagation()} className="mt-2 space-y-2">
                                          <textarea
                                              value={replyText}
                                              onChange={(e) => setReplyText(e.target.value)}
                                              placeholder="Type your reply..."
                                              className="w-full p-2 text-sm bg-gray-700 border border-gray-600 rounded text-white resize-none"
                                              rows={3}
                                          />
                                          <div className="flex justify-end space-x-2">
                                              <button
                                                  onClick={() => {
                                                    setReplyingToId(null);
                                                    setReplyText('');
                                                  }}
                                                  className="text-xs px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                                              >
                                                  Cancel
                                              </button>
                                              <button
                                                  onClick={() => handleSendReply(notification.id)}
                                                  disabled={!replyText.trim()}
                                                  className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white rounded font-medium transition-colors"
                                              >
                                                  Send Reply
                                              </button>
                                          </div>
                                      </div>
                                  ) : (
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setReplyingToId(notification.id);
                                          }}
                                          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                                      >
                                          Reply
                                      </button>
                                  )}
                              </div>
                          )}
                        </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Refresh/View All Button */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-800">
                <button
                  onClick={fetchNotifications}
                  className="w-full text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  🔄 Refresh notifications
                </button>
              </div>
            )}
          </div>

          {/* Backdrop to close when clicking outside */}
          <div
            className="fixed inset-0 z-[90] bg-black/10"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          ></div>
        </>
      )}
    </div>
  );
}
