import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectNotificationsLoading,
  selectUnreadCount,
} from "../store/notificationSlice";
import { Badge } from "./ui";
import { formatDate } from "../utils/format";

const typeTone = {
  budget_warning: "warning",
  budget_exceeded: "danger",
  budget: "warning",
  payment: "warning",
  goal: "success",
  loan: "primary",
  system: "neutral",
};

const POLL_MS = 60_000;

const NotificationBell = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);
  const unreadCount = useSelector(selectUnreadCount);
  const [open, setOpen] = useState(false);
  const [actionId, setActionId] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), POLL_MS);
    const onDataChange = () => dispatch(fetchNotifications());
    window.addEventListener("finance-data-changed", onDataChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("finance-data-changed", onDataChange);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center rounded-xl p-2.5 text-[var(--app-text)] hover:bg-[var(--app-surface-elevated)] transition"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={[
            "absolute right-0 mt-2 z-50 w-[min(100vw-2rem,22rem)]",
            "rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl",
            "overflow-hidden",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border)]">
            <h3 className="font-semibold text-sm text-[var(--app-text)]">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-primary)] hover:underline"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--app-text-muted)]">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </div>
            ) : recent.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--app-text-muted)]">
                No notifications yet
              </p>
            ) : (
              <ul className="divide-y divide-[var(--app-border)]">
                {recent.map((n) => (
                  <li
                    key={n._id}
                    className={[
                      "px-4 py-3 transition",
                      !n.isRead ? "bg-[var(--app-primary)]/5" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[var(--app-text)] truncate">
                            {n.title}
                          </p>
                          <Badge tone={typeTone[n.type] || "neutral"}>
                            {n.type?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--app-text-muted)] mt-1 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-[var(--app-text-muted)] mt-1">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead ? (
                        <button
                          type="button"
                          disabled={actionId === n._id}
                          onClick={() => handleMarkRead(n._id)}
                          className="shrink-0 text-[10px] font-semibold text-[var(--app-primary)] hover:underline disabled:opacity-50"
                        >
                          {actionId === n._id ? "..." : "Read"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--app-border)] bg-[var(--app-surface-elevated)]/50">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-[var(--app-primary)] hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
