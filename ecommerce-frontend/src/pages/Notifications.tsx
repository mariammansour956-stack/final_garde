import { useState } from "react";
import { Bell, CheckCheck, Trash2, Clock } from "lucide-react";
import { PageTitle } from "../components/ui/PageTitle";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useNotifications, useMarkRead, useMarkAllRead } from "../hooks/useNotifications";
import { formatDateTime } from "../utils/formatDate";
import type { Notification } from "../types";

export default function Notifications() {
  const { data, isLoading, isError } = useNotifications();
  const notifications = data?.items;
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const [showMarkAllDialog, setShowMarkAllDialog] = useState(false);

  const handleMarkRead = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
  };

  const notificationTypeIcon = (type: string) => {
    switch (type) {
      case "order_created":
        return "🛒";
      case "order_shipped":
        return "📦";
      case "order_delivered":
        return "✅";
      default:
        return "🔔";
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle title="Notifications" subtitle="Stay updated with your orders" />
        {notifications && notifications.length > 0 && data && data.total > 0 && (
          <button
            onClick={() => setShowMarkAllDialog(true)}
            disabled={markAllRead.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load notifications.</p>
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleMarkRead(notification)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                notification.is_read
                  ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  : "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">{notificationTypeIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        notification.is_read
                          ? "text-gray-900 dark:text-white"
                          : "font-semibold text-gray-900 dark:text-white"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(notification.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up! Notifications will appear here when you receive them."
          />
        )}
      </div>

      <ConfirmDialog
        open={showMarkAllDialog}
        onClose={() => setShowMarkAllDialog(false)}
        onConfirm={() => {
          markAllRead.mutate(undefined, {
            onSuccess: () => setShowMarkAllDialog(false),
          });
        }}
        title="Mark All as Read"
        message="Are you sure you want to mark all notifications as read?"
        confirmLabel="Mark All Read"
        isLoading={markAllRead.isPending}
      />
    </div>
  );
}
