"use client";
// src/app/admin/dashboard/page.tsx

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { tablesAPI, adminAPI } from "@/lib/api";
import type { DinnerTable, Notification } from "@/types";

function getTimeLeft(quorumMetAt: string | undefined): string {
  if (!quorumMetAt) return "";
  const elapsed = (Date.now() - new Date(quorumMetAt).getTime()) / 1000 / 60;
  const remaining = Math.max(0, 10 - elapsed);
  if (remaining === 0) return "Dispatching soon...";
  return `~${Math.ceil(remaining)}min left`;
}

export default function Dashboard() {
  const [tables, setTables] = useState<DinnerTable[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, notifRes]: any[] = await Promise.all([
        tablesAPI.getAll(),
        adminAPI.getNotifications({ unreadOnly: false }),
      ]);
      setTables(tablesRes.tables || []);
      setNotifications((notifRes.notifications || []).slice(0, 5));
      setUnreadCount(notifRes.unreadCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  const token = localStorage.getItem("pau_dinner_token");
  if (!token) return;
  fetchData();
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, [fetchData]);

  const stats = {
    total: tables.length,
    collecting: tables.filter((t) => t.status === "COLLECTING").length,
    quorum: tables.filter((t) => t.status === "QUORUM_MET").length,
    dispatched: tables.filter((t) => t.status === "DISPATCHED").length,
    totalOrders: tables.reduce((sum, t) => sum + t.orderedCount, 0),
  };

  const notifIcon: Record<string, string> = { LOW_STOCK: "🟡", SOLD_OUT: "🔴", DISPATCHED: "✅", NEW_ORDER: "📋" };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>
          PAU Final Year Dinner 2026
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", color: "#f5f0e8", marginBottom: "4px" }}>
          Operations Dashboard
        </h1>
        <p style={{ color: "#9b93b0", fontSize: "0.875rem" }}>
          Auto-refreshes every 30 seconds
          {unreadCount > 0 && (
            <Link href="/admin/notifications" style={{ marginLeft: "12px", color: "#fbbf24", fontWeight: 500, textDecoration: "none" }}>
              ⚠ {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
            </Link>
          )}
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        {[
          { label: "Total Orders", value: stats.totalOrders, color: "#c9a84c" },
          { label: "Collecting", value: stats.collecting, color: "#9ca3af" },
          { label: "Quorum Met", value: stats.quorum, color: "#fbbf24" },
          { label: "Dispatched", value: stats.dispatched, color: "#34d399" },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9b93b0", marginBottom: "8px" }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 600, color: stat.color }}>
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>
        {/* Table Grid */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#f5f0e8", marginBottom: "20px" }}>
            All Tables
          </h2>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "110px", borderRadius: "10px" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
              {tables.map((table) => {
                const statusColors: Record<string, { bg: string; border: string; dot: string }> = {
                  COLLECTING: { bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", dot: "#9ca3af" },
                  QUORUM_MET: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", dot: "#fbbf24" },
                  DISPATCHED: { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", dot: "#34d399" },
                };
                const colors = statusColors[table.status];
                return (
                  <Link key={table.tableNumber} href={`/admin/tables/${table.tableNumber}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      background: colors.bg, border: `1px solid ${colors.border}`,
                      borderRadius: "10px", padding: "16px 12px", textAlign: "center",
                      cursor: "pointer", transition: "all 0.2s ease",
                    }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", marginBottom: "8px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: colors.dot }} />
                        <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "#9b93b0" }}>TABLE</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 600, color: "#f5f0e8", lineHeight: 1 }}>
                        {table.tableNumber}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#9b93b0", marginTop: "6px" }}>
                        {table.orderedCount}/{table.capacity} ordered
                      </p>
                      {table.status === "QUORUM_MET" && (
                        <p style={{ fontSize: "0.65rem", color: "#fbbf24", marginTop: "4px" }}>
                          {getTimeLeft(table.quorumMetAt)}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent alerts */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#f5f0e8" }}>Recent Alerts</h2>
            <Link href="/admin/notifications" style={{ fontSize: "0.78rem", color: "#c9a84c", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {notifications.length === 0 ? (
              <div className="card-surface" style={{ padding: "24px", textAlign: "center" }}>
                <p style={{ color: "#9b93b0", fontSize: "0.85rem" }}>No alerts yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="card-surface" style={{ padding: "14px 16px", opacity: n.isRead ? 0.6 : 1 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "16px", flexShrink: 0 }}>{notifIcon[n.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", color: "#f5f0e8", lineHeight: 1.4, wordBreak: "break-word" }}>{n.message}</p>
                      <p style={{ fontSize: "0.7rem", color: "#9b93b0", marginTop: "4px" }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
