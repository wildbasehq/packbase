import React, { createContext, useContext, ReactNode } from 'react';
import { useNotificationsStore } from '@/lib/state/notifications';
import { Notification } from '@/lib/api/inbox';

// Define the context type
interface NotificationsContextType {
  // State
  notifications: Notification[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
  
  // Actions
  fetchNotifications: (cursorValue?: string | null, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reset: () => void;
}

// Create the context with a default value
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Provider component
export function NotificationsProvider({ children }: { children: ReactNode }) {
  // Get state and actions from the notifications store
  const { 
    notifications, 
    loading, 
    loadingMore, 
    error, 
    hasMore, 
    cursor,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    reset
  } = useNotificationsStore();

  // Create the context value
  const contextValue: NotificationsContextType = {
    notifications,
    loading,
    loadingMore,
    error,
    hasMore,
    cursor,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    reset
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Custom hook to use the notifications context
export function useNotifications() {
  const context = useContext(NotificationsContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  
  return context;
}