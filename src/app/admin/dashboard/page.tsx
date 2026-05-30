"use client";
// src/app/admin/dashboard/page.tsx

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { tablesAPI, adminAPI } from "@/lib/api";
import type { DinnerTable, Notification } from "@/types";

function getTimeLeft(quorumMetAt: string | undefined): string {
  if (!quorumMetAt) return "";
  const elapsed = (Date.now() - new Date(quorumMetAt).getTime()) / 1000 / 60;
  const remaining = Math.max(0, 5 - elapsed);
  if (remaining === 0) return "Send manually";
  return `~${Math.ceil(remaining)}min left`;
}

export default function Dashboard() {
  const [tables, setTables] = useState<DinnerTable[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

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

  const handleReset = async () => {
    if (!confirm("⚠️ This will delete ALL orders and reset all tables and menu quantities. Are you sure?")) return;
    setResetting(true);
    try {
      const token = localStorage.getItem("pau_dinner_token");
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.success) {
        ["STARTER", "MAIN", "DESSERT"].forEach((c) => localStorage.removeItem(`pau_dinner_ordered_${c}`));
        localStorage.removeItem("pau_dinner_name");
        localStorage.removeItem("pau_dinner_table");
        toast.success(data.message || "Reset complete!");
        fetchData();
      } else {
        toast.error(data.error || "Reset failed.");
      }
    } catch {
      toast.error("Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  const stats = {
    collecting: tables.filter((t) => t.status === "COLLECTING").length,
    quorum: tables.filter((t) => t.status === "QUORUM_MET").length,
    dispatched: tables.filter((t) => t.status === "DISPATCHED").length,
    totalOrders: tables.reduce((sum, t) => sum + t.orderedCount, 0),
  };

  const notifIcon: Record<string, string> = { LOW_STOCK: "🟡", SOLD_OUT: "🔴", DISPATCHED: "✅", NEW_ORDER: "📋" };

  const statusColors: Record<string, { bg: string; border: string; dot: string }> = {
    COLLECTING: { bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", dot: "#9ca3af" },
    QUORUM_MET: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", dot: "#fbbf24" },
    DISPATCHED: { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", dot: "#34d399" },
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>
          PAU Final Year Dinner 2026
        </p>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", color: "#f5f0e8", marginBottom: "4px" }}>
              Operations Dashboard
            </h1>
            <p style={{ color: "#9b93b0", fontSize: "0.8rem" }}>
              Auto-refreshes every 30s
              {unreadCount > 0 && (
                <Link href="/admin/notifications" style={{ marginLeft: "10px", color: "#fbbf24", fontWeight: 500, textDecoration: "none" }}>
                  ⚠ {unreadCount} alert{unreadCount !== 1 ? "s" : ""}
                </Link>
              )}
            </p>
          </div>
          <button onClick={handleReset} disabled={resetting} style={{
            background: "rgba(224,82,82,0.1)", color: "#e05252",
            border: "1px solid rgba(224,82,82,0.3)", borderRadius: "8px",
            padding: "8px 14px", cursor: "pointer", fontSize: "0.82rem",
            fontFamily: "var(--font-body)", fontWeight: 500,
            opacity: resetting ? 0.7 : 1, whiteSpace: "nowrap",
          }}>
            {resetting ? "Resetting..." : "🔄 Reset"}
          </button>
        </div>
      </div>

      {/* Stats strip — 2x2 on mobile, 4 across on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "24px" }}>
        {[
          { label: "Total Orders", value: stats.totalOrders, color: "#c9a84c" },
          { label: "Collecting", value: stats.collecting, color: "#9ca3af" },
          { label: "Quorum Met", value: stats.quorum, color: "#fbbf24" },
          { label: "Dispatched", value: stats.dispatched, color: "#34d399" },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: "16px" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9b93b0", marginBottom: "6px" }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 600, color: stat.color }}>
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main content — stacked on mobile, side by side on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>

        {/* Table Grid */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#f5f0e8", marginBottom: "16px" }}>
            All Tables
          </h2>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "8px" }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "90px", borderRadius: "10px" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "8px" }}>
              {tables.map((table) => {
                const colors = statusColors[table.status];
                return (
                  <Link key={table.tableNumber} href={`/admin/tables/${table.tableNumber}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      background: colors.bg, border: `1px solid ${colors.border}`,
                      borderRadius: "10px", padding: "10px 8px", textAlign: "center",
                      cursor: "pointer", transition: "all 0.2s ease",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "4px" }}>
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: colors.dot }} />
                        <span style={{ fontSize: "0.55rem", letterSpacing: "0.08em", color: "#9b93b0" }}>TABLE</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, color: "#f5f0e8", lineHeight: 1 }}>
                        {table.tableNumber}
                      </p>
                      <p style={{ fontSize: "0.62rem", color: "#9b93b0", marginTop: "4px" }}>
                        {table.orderedCount}/10
                      </p>
                      {table.status === "QUORUM_MET" && (
                        <p style={{ fontSize: "0.55rem", color: "#fbbf24", marginTop: "2px" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#f5f0e8" }}>Recent Alerts</h2>
            <Link href="/admin/notifications" style={{ fontSize: "0.78rem", color: "#c9a84c", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifications.length === 0 ? (
              <div className="card-surface" style={{ padding: "20px", textAlign: "center" }}>
                <p style={{ color: "#9b93b0", fontSize: "0.85rem" }}>No alerts yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="card-surface" style={{ padding: "12px 14px", opacity: n.isRead ? 0.6 : 1 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "14px", flexShrink: 0 }}>{notifIcon[n.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8rem", color: "#f5f0e8", lineHeight: 1.4, wordBreak: "break-word" }}>{n.message}</p>
                      <p style={{ fontSize: "0.68rem", color: "#9b93b0", marginTop: "3px" }}>
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
