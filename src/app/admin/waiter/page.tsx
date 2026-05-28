"use client";
// src/app/admin/waiter/page.tsx
// Waiter-only view — shows only dispatched tables with food summaries

import { useEffect, useState, useCallback } from "react";
import { tablesAPI, ordersAPI } from "@/lib/api";
import type { DinnerTable } from "@/types";

interface TableWithSummary extends DinnerTable {
  summary: Record<string, number>;
  orderCount: number;
  course?: string;
}

export default function WaiterPage() {
  const [tables, setTables] = useState<TableWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDispatched = useCallback(async () => {
    try {
      const res: any = await tablesAPI.getAll();
      const allTables: DinnerTable[] = res.tables || [];

      // Only show dispatched tables
      const dispatched = allTables.filter((t) => t.status === "DISPATCHED");

      // For each dispatched table, get order summary
      const withSummaries = await Promise.all(
        dispatched.map(async (table) => {
          try {
            const ordersRes: any = await ordersAPI.getByTable(table.tableNumber);
            const summary: Record<string, number> = ordersRes.summary || {};
            const orders = ordersRes.orders || [];
            const course = orders[0]?.course || "";
            return { ...table, summary, orderCount: orders.length, course };
          } catch {
            return { ...table, summary: {}, orderCount: 0, course: "" };
          }
        })
      );

      setTables(withSummaries);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDispatched();
    const interval = setInterval(fetchDispatched, 20000);
    return () => clearInterval(interval);
  }, [fetchDispatched]);

  const COURSE_EMOJI: Record<string, string> = {
    STARTER: "🥗",
    MAIN: "🍽️",
    DESSERT: "🍰",
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>
          Waiter View
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", color: "#f5f0e8" }}>
            Dispatched Orders
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <p style={{ fontSize: "0.78rem", color: "#9b93b0" }}>
              Auto-refreshes every 20s · Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <button
              onClick={fetchDispatched}
              style={{
                background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "8px", padding: "6px 14px", cursor: "pointer",
                color: "#c9a84c", fontSize: "0.8rem", fontFamily: "var(--font-body)",
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "140px" }}>
          <p style={{ fontSize: "0.7rem", color: "#9b93b0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
            Tables to serve
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "#c9a84c" }}>
            {loading ? "—" : tables.length}
          </p>
        </div>
        <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "140px" }}>
          <p style={{ fontSize: "0.7rem", color: "#9b93b0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
            Total orders
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "#34d399" }}>
            {loading ? "—" : tables.reduce((sum, t) => sum + t.orderCount, 0)}
          </p>
        </div>
      </div>

      {/* Dispatched tables */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "140px", borderRadius: "12px" }} />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="card" style={{ padding: "64px", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⏳</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#f5f0e8", marginBottom: "8px" }}>
            No dispatched orders yet
          </h2>
          <p style={{ color: "#9b93b0" }}>
            Orders will appear here once the admin dispatches a table.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tables.map((table) => (
            <div key={table.id} className="card" style={{ padding: "24px" }}>
              {/* Table header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "12px", flexShrink: 0,
                    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#34d399" }}>
                      {table.tableNumber}
                    </span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#f5f0e8" }}>
                        Table {table.tableNumber}
                      </h2>
                      <span className="badge badge-dispatched">✅ Dispatched</span>
                      {table.course && (
                        <span style={{
                          fontSize: "0.72rem", padding: "2px 10px", borderRadius: "20px",
                          background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
                          color: "#c9a84c", fontWeight: 600,
                        }}>
                          {COURSE_EMOJI[table.course]} {table.course.charAt(0) + table.course.slice(1).toLowerCase()}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "#9b93b0" }}>
                      {table.orderCount} {table.orderCount === 1 ? "order" : "orders"} ·{" "}
                      Dispatched {table.dispatchedAt ? new Date(table.dispatchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      {table.assignedWaiter && (
                        <span style={{ marginLeft: "8px", color: "#c9a84c" }}>
                          · Assigned to {(table.assignedWaiter as any).name}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Food summary */}
              <div>
                <p style={{ fontSize: "0.7rem", color: "#9b93b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                  Food to bring
                </p>
                {Object.keys(table.summary).length === 0 ? (
                  <p style={{ color: "#9b93b0", fontSize: "0.85rem" }}>No items</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {Object.entries(table.summary).map(([item, count]) => (
                      <div key={item} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.15)",
                        borderRadius: "8px", padding: "8px 14px",
                      }}>
                        <span style={{
                          fontFamily: "var(--font-display)", fontSize: "1.3rem",
                          color: "#c9a84c", minWidth: "24px", textAlign: "center",
                        }}>
                          ×{count}
                        </span>
                        <span style={{ color: "#f5f0e8", fontSize: "0.9rem", fontWeight: 500 }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
