"use client";
// src/app/admin/tables/[tableNumber]/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ordersAPI, adminAPI } from "@/lib/api";
import type { Order, DinnerTable } from "@/types";

function GraceTimer({ quorumMetAt }: { quorumMetAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const elapsed = (Date.now() - new Date(quorumMetAt).getTime()) / 1000 / 60;
      const remaining = Math.max(0, 10 - elapsed);
      if (remaining <= 0) {
        setTimeLeft("Dispatching imminently...");
      } else {
        const mins = Math.floor(remaining);
        const secs = Math.floor((remaining - mins) * 60);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")} remaining`);
      }
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [quorumMetAt]);

  return (
    <div style={{
      background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
      borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center",
      gap: "12px", marginBottom: "24px",
    }}>
      <span style={{ fontSize: "20px" }}>⏳</span>
      <div>
        <p style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2px" }}>
          Grace Period Active
        </p>
        <p style={{ color: "#f5f0e8", fontSize: "0.9rem" }}>
          Quorum reached — auto-dispatching in <strong style={{ color: "#fbbf24" }}>{timeLeft}</strong>
        </p>
        <p style={{ color: "#9b93b0", fontSize: "0.78rem", marginTop: "2px" }}>
          Late orders placed during this window will be included in the batch.
        </p>
      </div>
    </div>
  );
}

export default function TableDetailPage() {
  const params = useParams();
  const tableNumber = parseInt(params.tableNumber as string);

  const [orders, setOrders] = useState<Order[]>([]);
  const [table, setTable] = useState<DinnerTable | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [waiters, setWaiters] = useState<any[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, waitersRes]: any[] = await Promise.all([
        ordersAPI.getByTable(tableNumber),
        adminAPI.getWaiters(),
      ]);
      setOrders(ordersRes.orders || []);
      setTable(ordersRes.table || null);
      setSummary(ordersRes.summary || {});
      setWaiters(waitersRes.waiters || []);
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
      await adminAPI.dispatch(tableNumber, selectedWaiter || undefined);
      toast.success(`Table ${tableNumber} dispatched to waiter!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Dispatch failed.");
    } finally {
      setDispatching(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const dispatchedOrders = orders.filter((o) => o.status === "DISPATCHED");
  const isDispatched = table?.status === "DISPATCHED";

  return (
    <div style={{ padding: "40px", maxWidth: "900px" }}>
      {/* Back */}
      <Link href="/admin/tables" style={{ color: "#9b93b0", textDecoration: "none", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
        ← Back to Tables
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "4px" }}>
            Table Detail
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.6rem", color: "#f5f0e8", lineHeight: 1 }}>
            Table {tableNumber}
          </h1>
          {table && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
              <span
                className={`badge ${
                  table.status === "COLLECTING" ? "badge-collecting"
                  : table.status === "QUORUM_MET" ? "badge-quorum"
                  : "badge-dispatched"
                }`}
              >
                {table.status === "COLLECTING" ? "🔄 Collecting" : table.status === "QUORUM_MET" ? "⏳ Quorum Met" : "✅ Dispatched"}
              </span>
              <span style={{ color: "#9b93b0", fontSize: "0.85rem" }}>
                {table.orderedCount} / {table.capacity} orders received
              </span>
            </div>
          )}
        </div>

        {/* Dispatch panel */}
        {!isDispatched && (
          <div className="card" style={{ padding: "20px", minWidth: "260px" }}>
            <p className="label">Assign Waiter (Optional)</p>
            <select
              className="input-field"
              value={selectedWaiter}
              onChange={(e) => setSelectedWaiter(e.target.value)}
              style={{ marginBottom: "12px", cursor: "pointer" }}
            >
              <option value="">— Unassigned —</option>
              {waiters.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
              ))}
            </select>
            <button
              className="btn-gold"
              onClick={handleDispatch}
              disabled={dispatching || pendingOrders.length === 0}
              style={{
                width: "100%", fontSize: "0.9rem",
                opacity: (dispatching || pendingOrders.length === 0) ? 0.6 : 1,
              }}
            >
              {dispatching ? "Dispatching..." : `Send to Waiter (${pendingOrders.length} orders)`}
            </button>
            {pendingOrders.length === 0 && (
              <p style={{ fontSize: "0.75rem", color: "#9b93b0", marginTop: "8px", textAlign: "center" }}>No pending orders to dispatch</p>
            )}
          </div>
        )}

        {isDispatched && (
          <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "10px", padding: "16px 20px" }}>
            <p style={{ color: "#34d399", fontWeight: 600, marginBottom: "4px" }}>✅ Dispatched</p>
            <p style={{ color: "#9b93b0", fontSize: "0.82rem" }}>
              {table?.dispatchedAt && new Date(table.dispatchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}
      </div>

      {/* Grace period timer */}
      {table?.status === "QUORUM_MET" && table.quorumMetAt && (
        <GraceTimer quorumMetAt={table.quorumMetAt} />
      )}

      {/* Food Summary */}
      {Object.keys(summary).length > 0 && (
        <div className="card" style={{ padding: "24px", marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#f5f0e8", marginBottom: "16px" }}>
            Food Summary
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
            {Object.entries(summary).map(([item, count]) => (
              <div key={item} className="card-surface" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", color: "#f5f0e8" }}>{item}</span>
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#c9a84c",
                  background: "rgba(201,168,76,0.1)", padding: "2px 12px", borderRadius: "8px",
                }}>×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders list */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#f5f0e8", marginBottom: "16px" }}>
          Individual Orders ({orders.length})
        </h2>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "10px" }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="card-surface" style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ color: "#9b93b0" }}>No orders yet for this table.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {orders.map((order, i) => (
              <div key={order.id} className="card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontWeight: 500, color: "#f5f0e8", marginBottom: "2px" }}>
                      {i + 1}. {order.studentName}
                    </p>
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
                    <span key={item.id} style={{
                      background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: "6px", padding: "4px 10px", fontSize: "0.78rem", color: "#e8c97e",
                    }}>
                      {item.menuItemName}
                    </span>
                  ))}
                </div>
                {order.specialNotes && (
                  <p style={{ fontSize: "0.78rem", color: "#9b93b0", marginTop: "8px", fontStyle: "italic" }}>
                    Note: {order.specialNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
