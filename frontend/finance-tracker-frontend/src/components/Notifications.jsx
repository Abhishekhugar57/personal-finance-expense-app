import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button, Card, PageHeader, EmptyState, Badge } from "./ui";
import { formatDate } from "../utils/format";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  selectNotifications,
  selectNotificationsLoading,
  selectUnreadCount,
} from "../store/notificationSlice";

const typeTone = {
  budget_warning: "warning",
  budget_exceeded: "danger",
  budget: "warning",
  payment: "warning",
  goal: "success",
  loan: "primary",
  system: "neutral",
};

const Notifications = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);
  const unread = useSelector(selectUnreadCount);
  const [actionId, setActionId] = React.useState(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = async (id) => {
    setActionId(id);
    try {
      await dispatch(markNotificationRead(id)).unwrap();
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllNotificationsRead()).unwrap();
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id) => {
    setActionId(id);
    try {
      await dispatch(deleteNotification(id)).unwrap();
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up"}
        icon={Bell}
        action={
          unread > 0 ? (
            <Button variant="secondary" onClick={handleMarkAllRead}>
              <CheckCheck size={18} /> Mark all read
            </Button>
          ) : null
        }
      />

      {loading ? (
        <p className="text-[var(--app-text-muted)]">Loading...</p>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Budget alerts and payment reminders will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n._id}
              padding="p-4"
              className={!n.isRead ? "border-[var(--app-primary)]/30 bg-[var(--app-primary)]/5" : ""}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[var(--app-text)] text-sm">{n.title}</h3>
                    <Badge tone={typeTone[n.type] || "neutral"}>
                      {n.type?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--app-text-muted)] mt-1">{n.message}</p>
                  {n.categoryName ? (
                    <p className="text-xs text-[var(--app-text-muted)] mt-1">
                      Category: {n.categoryName}
                    </p>
                  ) : null}
                  <p className="text-xs text-[var(--app-text-muted)] mt-2">{formatDate(n.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!n.isRead ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actionId === n._id}
                      onClick={() => handleMarkRead(n._id)}
                    >
                      Mark read
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actionId === n._id}
                    onClick={() => handleDelete(n._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
