"use client";
// src/app/admin/tables/[tableNumber]/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ordersAPI, adminAPI, courseAPI } from "@/lib/api";
import type { Order, DinnerTable, Course } from "@/types";

const COURSE_CONFIG: Record<Course, { label: string; emoji: string; color: string }> = {
  STARTER: { label: "Starter", emoji: "🥗", color: "#34d399" },
  MAIN: { label: "Main Course", emoji: "🍽️", color: "#c9a84c" },
  DESSERT: { label: "Dessert", emoji: "🍰", color: "#a78bfa" },
};

function GraceTimer({ quorumMetAt }: { quorumMetAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const elapsed = (Date.now() - new Date(quorumMetAt).getTime()) / 1000 / 60;
      const remaining = Math.max(0, 10 - elapsed);
      if (remaining <= 0) { setTimeLeft("Dispatching imminently..."); return; }
      const mins = Math.floor(remaining);
      const secs = Math.floor((remaining - mins) * 60);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")} remaining`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [quorumMetAt]);

  return (
    <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
      <span style={{ fontSize: "20px" }}>⏳</span>
      <div>
        <p style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2px" }}>Grace Period Active</p>
        <p style={{ color: "#f5f0e8", fontSize: "0.9rem" }}>Auto-dispatching in <strong style={{ color: "#fbbf24" }}>{timeLeft}</strong></p>
      </div>
    </div>
  );
}

export default function TableDetailPage() {
  const params = useParams();
  const tableNumber = parseInt(params.tableNumber as string);

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [table, setTable] = useState<DinnerTable | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course>("STARTER");

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, courseRes]: any[] = await Promise.all([
        ordersAPI.getByTable(tableNumber),
        courseAPI.getActive(),
      ]);
      setAllOrders(ordersRes.orders || []);
      setTable(ordersRes.table || null);
      setActiveCourse(courseRes.activeCourse || null);
      if (courseRes.activeCourse) setSelectedCourse(courseRes.activeCourse as Course);
    } finally {
      setLoading(false);
    }
  }, [tableNumber]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 15000);
    return () => clearInterval(i);
  }, [fetchData]);

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      await adminAPI.dispatch(tableNumber);
      toast.success(`Table ${tableNumber} ${activeCourse} orders dispatched!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Dispatch failed.");
    } finally {
      setDispatching(false);
    }
  };

  // Per-course data
  const courseOrders = (course: Course) => allOrders.filter((o) => o.course === course);
  const courseSummary = (course: Course) => {
    const summary: Record<string, number> = {};
    for (const order of courseOrders(course)) {
      for (const item of order.items) {
        summary[item.menuItemName] = (summary[item.menuItemName] || 0) + item.quantity;
      }
    }
    return summary;
  };
  const courseDispatched = (course: Course) => courseOrders(course).some((o) => o.status === "DISPATCHED");
  const coursePending = (course: Course) => courseOrders(course).filter((o) => o.status === "PENDING");

  const COURSES: Course[] = ["STARTER", "MAIN", "DESSERT"];

  return (
    <div style={{ padding: "40px", maxWidth: "960px" }}>
      <Link href="/admin/tables" style={{ color: "#9b93b0", textDecoration: "none", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
        ← Back to Tables
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "4px" }}>Table Detail</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.6rem", color: "#f5f0e8", lineHeight: 1 }}>Table {tableNumber}</h1>
          {activeCourse && (
            <p style={{ color: "#9b93b0", fontSize: "0.85rem", marginTop: "8px" }}>
              Active course: <strong style={{ color: COURSE_CONFIG[activeCourse].color }}>{COURSE_CONFIG[activeCourse].emoji} {COURSE_CONFIG[activeCourse].label}</strong>
            </p>
          )}
        </div>

        {/* Dispatch button — only for active course */}
        {activeCourse && !courseDispatched(activeCourse) && (
          <div className="card" style={{ padding: "20px", minWidth: "220px" }}>
            <p className="label" style={{ marginBottom: "4px" }}>Dispatch Active Course</p>
            <p style={{ fontSize: "0.78rem", color: "#9b93b0", marginBottom: "12px" }}>
              {COURSE_CONFIG[activeCourse].emoji} {COURSE_CONFIG[activeCourse].label} — {coursePending(activeCourse).length} pending
            </p>
            <button
              className="btn-gold"
              onClick={handleDispatch}
              disabled={dispatching || coursePending(activeCourse).length === 0}
              style={{ width: "100%", fontSize: "0.9rem", opacity: (dispatching || coursePending(activeCourse).length === 0) ? 0.6 : 1 }}
            >
              {dispatching ? "Dispatching..." : `Send to Waiter`}
            </button>
          </div>
        )}
        {activeCourse && courseDispatched(activeCourse) && (
          <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "10px", padding: "16px 20px" }}>
            <p style={{ color: "#34d399", fontWeight: 600 }}>✅ {COURSE_CONFIG[activeCourse].label} Dispatched</p>
          </div>
        )}
      </div>

      {/* Grace timer */}
      {table?.status === "QUORUM_MET" && table.quorumMetAt && (
        <GraceTimer quorumMetAt={table.quorumMetAt} />
      )}

      {/* ── Per-Course Summary Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
        {COURSES.map((course) => {
          const config = COURSE_CONFIG[course];
          const orders = courseOrders(course);
          const dispatched = courseDispatched(course);
          const isActive = activeCourse === course;
          return (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
              style={{
                padding: "16px", borderRadius: "10px", border: "none", cursor: "pointer", textAlign: "left",
                background: selectedCourse === course ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                outline: selectedCourse === course ? `2px solid ${config.color}44` : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "18px" }}>{config.emoji}</span>
                {isActive && <span style={{ fontSize: "0.6rem", color: config.color, fontWeight: 700, letterSpacing: "0.06em", background: `${config.color}22`, padding: "2px 8px", borderRadius: "10px" }}>OPEN</span>}
                {dispatched && !isActive && <span style={{ fontSize: "0.6rem", color: "#34d399", fontWeight: 700 }}>✓ DONE</span>}
              </div>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#f5f0e8", marginBottom: "4px" }}>{config.label}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: config.color }}>
                {orders.length}<span style={{ fontSize: "0.8rem", color: "#9b93b0" }}>/10</span>
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected course detail */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#f5f0e8" }}>
            {COURSE_CONFIG[selectedCourse].emoji} {COURSE_CONFIG[selectedCourse].label} Orders
          </h2>
          <span style={{ fontSize: "0.78rem", color: "#9b93b0" }}>
            ({courseOrders(selectedCourse).length} orders)
          </span>
        </div>

        {/* Food summary for selected course */}
        {Object.keys(courseSummary(selectedCourse)).length > 0 && (
          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <p className="label" style={{ marginBottom: "12px" }}>Food Summary</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {Object.entries(courseSummary(selectedCourse)).map(([item, count]) => (
                <div key={item} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "8px 14px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#c9a84c" }}>×{count}</span>
                  <span style={{ color: "#f5f0e8", fontSize: "0.88rem" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual orders for selected course */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "10px" }} />)}
          </div>
        ) : courseOrders(selectedCourse).length === 0 ? (
          <div className="card-surface" style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ color: "#9b93b0" }}>No {COURSE_CONFIG[selectedCourse].label.toLowerCase()} orders yet for this table.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {courseOrders(selectedCourse).map((order, i) => (
              <div key={order.id} className="card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontWeight: 500, color: "#f5f0e8", marginBottom: "2px" }}>{i + 1}. {order.studentName}</p>
                    <p style={{ fontSize: "0.75rem", color: "#9b93b0" }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`badge ${order.status === "PENDING" ? "badge-quorum" : "badge-dispatched"}`}>
                    {order.status === "PENDING" ? "Pending" : "Dispatched"}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {order.items.map((item) => (
                    <span key={item.id} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", padding: "4px 10px", fontSize: "0.78rem", color: "#e8c97e" }}>
                      {item.menuItemName}
                    </span>
                  ))}
                </div>
                {order.specialNotes && (
                  <p style={{ fontSize: "0.78rem", color: "#9b93b0", marginTop: "8px", fontStyle: "italic" }}>Note: {order.specialNotes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
