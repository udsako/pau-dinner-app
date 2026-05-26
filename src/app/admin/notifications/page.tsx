"use client";
// src/app/admin/notifications/page.tsx

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { adminAPI } from "@/lib/api";
import type { Notification, NotificationType } from "@/types";

const TYPE_CONFIG: Record<NotificationType, { icon: string; label: string; color: string }> = {
  LOW_STOCK: { icon: "🟡", label: "Low Stock", color: "#fbbf24" },
  SOLD_OUT: { icon: "🔴", label: "Sold Out", color: "#e05252" },
  DISPATCHED: { icon: "✅", label: "Dispatched", color: "#34d399" },
  NEW_ORDER: { icon: "📋", label: "New Order", color: "#c9a84c" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | NotificationType>("ALL");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res: any = await adminAPI.getNotifications(
        filter !== "ALL" ? { type: filter } : {}
      );
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
    const i = setInterval(fetchNotifications, 15000);
    return () => clearInterval(i);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await adminAPI.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await adminAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>
            System Events
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", color: "#f5f0e8" }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span style={{
                background: "#e05252", color: "white", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "20px", padding: "4px 10px", lineHeight: 1,
              }}>
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn-ghost"
            onClick={handleMarkAll}
            disabled={markingAll}
            style={{ fontSize: "0.85rem" }}
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        {(["ALL", "LOW_STOCK", "SOLD_OUT", "DISPATCHED", "NEW_ORDER"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px", borderRadius: "20px", border: "none", cursor: "pointer",
              background: filter === f ? "#c9a84c" : "rgba(255,255,255,0.05)",
              color: filter === f ? "#0d0826" : "#9b93b0",
              fontFamily: "var(--font-body)", fontWeight: filter === f ? 600 : 400,
              fontSize: "0.8rem", transition: "all 0.2s ease",
            }}
          >
            {f === "ALL" ? "All" : (
              <span>{TYPE_CONFIG[f as NotificationType].icon} {TYPE_CONFIG[f as NotificationType].label}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "10px" }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🔔</p>
          <p style={{ color: "#9b93b0" }}>No notifications yet. They'll appear here as orders come in.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type];
            return (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: "18px 20px",
                  opacity: n.isRead ? 0.55 : 1,
                  borderColor: n.isRead ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.2)",
                  transition: "opacity 0.3s ease",
                }}
              >
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>{config.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
                        textTransform: "uppercase", color: config.color,
                        background: `${config.color}18`, padding: "2px 8px", borderRadius: "10px",
                      }}>
                        {config.label}
                      </span>
                      {!n.isRead && (
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#e05252", flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ color: "#f5f0e8", fontSize: "0.9rem", lineHeight: 1.5 }}>{n.message}</p>
                    <p style={{ fontSize: "0.75rem", color: "#9b93b0", marginTop: "6px" }}>
                      {new Date(n.createdAt).toLocaleString([], {
                        dateStyle: "medium", timeStyle: "short",
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      style={{
                        background: "transparent", border: "1px solid rgba(201,168,76,0.2)",
                        borderRadius: "6px", padding: "5px 10px", cursor: "pointer",
                        color: "#9b93b0", fontSize: "0.72rem", fontFamily: "var(--font-body)",
                        flexShrink: 0, transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = "#c9a84c")}
                      onMouseOut={(e) => (e.currentTarget.style.color = "#9b93b0")}
                    >
                      ✓ Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
