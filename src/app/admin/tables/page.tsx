"use client";
// src/app/admin/tables/page.tsx

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { tablesAPI } from "@/lib/api";
import type { DinnerTable } from "@/types";

const STATUS_LABELS: Record<string, { label: string; badge: string; icon: string }> = {
  COLLECTING: { label: "Collecting Orders", badge: "badge-collecting", icon: "🔄" },
  QUORUM_MET: { label: "Quorum Met — Grace Period", badge: "badge-quorum", icon: "⏳" },
  DISPATCHED: { label: "Dispatched", badge: "badge-dispatched", icon: "✅" },
};

function getTimeLeft(quorumMetAt: string | undefined): string {
  if (!quorumMetAt) return "";
  const elapsed = (Date.now() - new Date(quorumMetAt).getTime()) / 1000 / 60;
  const remaining = Math.max(0, 10 - elapsed);
  if (remaining <= 0) return "Dispatching imminently";
  return `${Math.ceil(remaining)} min remaining`;
}

export default function TablesPage() {
  const [tables, setTables] = useState<DinnerTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "COLLECTING" | "QUORUM_MET" | "DISPATCHED">("ALL");

  const fetchTables = useCallback(async () => {
    try {
      const res: any = await tablesAPI.getAll();
      setTables(res.tables || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    const i = setInterval(fetchTables, 20000);
    return () => clearInterval(i);
  }, [fetchTables]);

  const filtered = filter === "ALL" ? tables : tables.filter((t) => t.status === filter);

  return (
    <div style={{ padding: "40px", maxWidth: "1000px" }}>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>
          Operations
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", color: "#f5f0e8" }}>
          Table Overview
        </h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        {(["ALL", "COLLECTING", "QUORUM_MET", "DISPATCHED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
              background: filter === f ? "#c9a84c" : "rgba(255,255,255,0.05)",
              color: filter === f ? "#0d0826" : "#9b93b0",
              fontFamily: "var(--font-body)", fontWeight: filter === f ? 600 : 400,
              fontSize: "0.82rem", transition: "all 0.2s ease",
            }}
          >
            {f === "ALL" ? `All (${tables.length})` : f === "QUORUM_MET" ? `Quorum Met (${tables.filter((t) => t.status === "QUORUM_MET").length})` : `${f.charAt(0) + f.slice(1).toLowerCase().replace("_", " ")} (${tables.filter((t) => t.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Table list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "10px" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((table) => {
            const status = STATUS_LABELS[table.status];
            return (
              <Link key={table.id} href={`/admin/tables/${table.tableNumber}`} style={{ textDecoration: "none" }}>
                <div
                  className="card"
                  style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: "20px", cursor: "pointer", transition: "border-color 0.2s ease" }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)")}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.15)")}
                >
                  {/* Table number */}
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "10px", flexShrink: 0,
                    background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#c9a84c" }}>
                      {table.tableNumber}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <p style={{ fontWeight: 500, color: "#f5f0e8" }}>Table {table.tableNumber}</p>
                      <span className={`badge ${status.badge}`}>{status.icon} {status.label}</span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "#9b93b0" }}>
                      {table.orderedCount} / {table.capacity} ordered
                      {table.status === "QUORUM_MET" && table.quorumMetAt && (
                        <span style={{ color: "#fbbf24", marginLeft: "12px" }}>⏱ {getTimeLeft(table.quorumMetAt)}</span>
                      )}
                      {table.assignedWaiter && (
                        <span style={{ marginLeft: "12px", color: "#9b93b0" }}>
                          👤 {(table.assignedWaiter as any).name}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: "120px", flexShrink: 0 }}>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "3px",
                        width: `${(table.orderedCount / table.capacity) * 100}%`,
                        background: table.status === "DISPATCHED" ? "#34d399" : table.status === "QUORUM_MET" ? "#fbbf24" : "#c9a84c",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <p style={{ fontSize: "0.68rem", color: "#9b93b0", marginTop: "4px", textAlign: "right" }}>
                      {Math.round((table.orderedCount / table.capacity) * 100)}%
                    </p>
                  </div>

                  <span style={{ color: "#c9a84c", fontSize: "1.2rem", flexShrink: 0 }}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
