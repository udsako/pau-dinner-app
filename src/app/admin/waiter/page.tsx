"use client";
// src/app/admin/waiter/page.tsx

import { useEffect, useState, useCallback } from "react";
import { tablesAPI, ordersAPI } from "@/lib/api";
import type { Course } from "@/types";

interface DispatchedTicket {
  tableNumber: number;
  course: Course;
  summary: Record<string, number>;
  orderCount: number;
}

const COURSE_CONFIG: Record<Course, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  STARTER: { label: "Starter", emoji: "🥗", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.3)" },
  MAIN: { label: "Main Course", emoji: "🍽️", color: "#c9a84c", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.3)" },
  DESSERT: { label: "Dessert", emoji: "🍰", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.3)" },
};

export default function WaiterPage() {
  const [tickets, setTickets] = useState<DispatchedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filterCourse, setFilterCourse] = useState<Course | "ALL">("ALL");

  const fetchDispatched = useCallback(async () => {
    try {
      const res: any = await tablesAPI.getAll();
      const allTables = res.tables || [];
      const allTickets: DispatchedTicket[] = [];

      for (const table of allTables) {
        try {
          const ordersRes: any = await ordersAPI.getByTable(table.tableNumber);
          const orders = ordersRes.orders || [];
          const courses: Course[] = ["STARTER", "MAIN", "DESSERT"];
          for (const course of courses) {
            const courseDispatched = orders.filter((o: any) => o.course === course && o.status === "DISPATCHED");
            if (courseDispatched.length === 0) continue;
            const summary: Record<string, number> = {};
            for (const order of courseDispatched) {
              for (const item of order.items) {
                summary[item.menuItemName] = (summary[item.menuItemName] || 0) + item.quantity;
              }
            }
            allTickets.push({ tableNumber: table.tableNumber, course, summary, orderCount: courseDispatched.length });
          }
        } catch { /* skip */ }
      }

      const courseOrder: Record<Course, number> = { STARTER: 0, MAIN: 1, DESSERT: 2 };
      allTickets.sort((a, b) =>
        courseOrder[a.course] !== courseOrder[b.course]
          ? courseOrder[a.course] - courseOrder[b.course]
          : a.tableNumber - b.tableNumber
      );

      setTickets(allTickets);
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

  const filtered = filterCourse === "ALL" ? tickets : tickets.filter((t) => t.course === filterCourse);

  return (
    <div style={{ padding: "20px 16px", maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>Waiter View</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 5vw, 2.2rem)", color: "#f5f0e8" }}>Dispatched Orders</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <p style={{ fontSize: "0.72rem", color: "#9b93b0" }}>
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <button onClick={fetchDispatched} style={{
              background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "8px", padding: "6px 12px", cursor: "pointer", color: "#c9a84c",
              fontSize: "0.8rem", fontFamily: "var(--font-body)",
            }}>
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats — 2x2 on mobile */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "20px" }}>
        {[
          { label: "All Tickets", value: tickets.length, color: "#c9a84c" },
          { label: "🥗 Starters", value: tickets.filter((t) => t.course === "STARTER").length, color: "#34d399" },
          { label: "🍽️ Mains", value: tickets.filter((t) => t.course === "MAIN").length, color: "#c9a84c" },
          { label: "🍰 Desserts", value: tickets.filter((t) => t.course === "DESSERT").length, color: "#a78bfa" },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: "0.62rem", color: "#9b93b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{stat.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: stat.color }}>{loading ? "—" : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Course filter — scrollable */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
        {(["ALL", "STARTER", "MAIN", "DESSERT"] as const).map((c) => (
          <button key={c} onClick={() => setFilterCourse(c)} style={{
            padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer",
            background: filterCourse === c ? "#c9a84c" : "rgba(255,255,255,0.05)",
            color: filterCourse === c ? "#0d0826" : "#9b93b0",
            fontFamily: "var(--font-body)", fontWeight: filterCourse === c ? 600 : 400,
            fontSize: "0.8rem", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {c === "ALL" ? "All" : `${COURSE_CONFIG[c].emoji} ${COURSE_CONFIG[c].label}`}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "12px" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#f5f0e8", marginBottom: "8px" }}>No dispatched orders yet</h2>
          <p style={{ color: "#9b93b0", fontSize: "0.85rem" }}>Orders appear here once the admin dispatches a table.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((ticket, i) => {
            const config = COURSE_CONFIG[ticket.course];
            return (
              <div key={`${ticket.tableNumber}-${ticket.course}-${i}`} className="card" style={{ padding: "16px", borderLeft: `4px solid ${config.color}` }}>
                {/* Ticket header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                    background: config.bg, border: `1px solid ${config.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: config.color }}>{ticket.tableNumber}</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px", flexWrap: "wrap" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "#f5f0e8" }}>Table {ticket.tableNumber}</p>
                      <span style={{
                        fontSize: "0.65rem", padding: "2px 8px", borderRadius: "20px",
                        background: config.bg, border: `1px solid ${config.border}`,
                        color: config.color, fontWeight: 700,
                      }}>
                        {config.emoji} {config.label}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#9b93b0" }}>
                      {ticket.orderCount} {ticket.orderCount === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>

                {/* Food items */}
                <div>
                  <p style={{ fontSize: "0.65rem", color: "#9b93b0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Bring to table</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {Object.entries(ticket.summary).map(([item, count]) => (
                      <div key={item} style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.15)",
                        borderRadius: "8px", padding: "6px 12px",
                      }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: config.color }}>×{count}</span>
                        <span style={{ color: "#f5f0e8", fontSize: "0.85rem", fontWeight: 500 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
