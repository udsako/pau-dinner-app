"use client";
// src/app/admin/tables/page.tsx

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { tablesAPI } from "@/lib/api";
import type { DinnerTable } from "@/types";

const STATUS_LABELS: Record<string, { label: string; short: string; badge: string; icon: string }> = {
  COLLECTING: { label: "Collecting Orders", short: "Collecting", badge: "badge-collecting", icon: "🔄" },
  QUORUM_MET: { label: "Quorum Met — Grace Period", short: "Quorum Met", badge: "badge-quorum", icon: "⏳" },
  DISPATCHED: { label: "Dispatched", short: "Dispatched", badge: "badge-dispatched", icon: "✅" },
};

function getTimeLeft(quorumMetAt: string | undefined): string {
  if (!quorumMetAt) return "";
  const elapsed = (Date.now() - new Date(quorumMetAt).getTime()) / 1000 / 60;
  const remaining = Math.max(0, 5 - elapsed);
  if (remaining <= 0) return "Send manually";
  return `${Math.ceil(remaining)}min left`;
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

  const counts = {
    ALL: tables.length,
    COLLECTING: tables.filter((t) => t.status === "COLLECTING").length,
    QUORUM_MET: tables.filter((t) => t.status === "QUORUM_MET").length,
    DISPATCHED: tables.filter((t) => t.status === "DISPATCHED").length,
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: "1000px" }}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>Operations</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 5vw, 2.2rem)", color: "#f5f0e8" }}>Table Overview</h1>
      </div>

      {/* Filter tabs — scrollable on mobile */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
        {(["ALL", "COLLECTING", "QUORUM_MET", "DISPATCHED"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer",
            background: filter === f ? "#c9a84c" : "rgba(255,255,255,0.05)",
            color: filter === f ? "#0d0826" : "#9b93b0",
            fontFamily: "var(--font-body)", fontWeight: filter === f ? 600 : 400,
            fontSize: "0.8rem", transition: "all 0.2s ease", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {f === "ALL" ? `All (${counts.ALL})` :
             f === "QUORUM_MET" ? `Quorum (${counts.QUORUM_MET})` :
             f === "COLLECTING" ? `Collecting (${counts.COLLECTING})` :
             `Dispatched (${counts.DISPATCHED})`}
          </button>
        ))}
      </div>

      {/* Table list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "72px", borderRadius: "10px" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((table) => {
            const status = STATUS_LABELS[table.status];
            const pct = Math.round((table.orderedCount / table.capacity) * 100);
            const barColor = table.status === "DISPATCHED" ? "#34d399" : table.status === "QUORUM_MET" ? "#fbbf24" : "#c9a84c";
            return (
              <Link key={table.id} href={`/admin/tables/${table.tableNumber}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: "14px 16px", cursor: "pointer", transition: "border-color 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Table number badge */}
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                      background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#c9a84c" }}>
                        {table.tableNumber}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <p style={{ fontWeight: 500, color: "#f5f0e8", fontSize: "0.9rem" }}>Table {table.tableNumber}</p>
                        <span className={`badge ${status.badge}`} style={{ fontSize: "0.62rem" }}>
                          {status.icon} {status.short}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Progress bar */}
                        <div style={{ flex: 1, height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", maxWidth: "120px" }}>
                          <div style={{ height: "100%", borderRadius: "3px", width: `${pct}%`, background: barColor, transition: "width 0.5s ease" }} />
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "#9b93b0", whiteSpace: "nowrap" }}>
                          {table.orderedCount}/{table.capacity}
                          {table.status === "QUORUM_MET" && table.quorumMetAt && (
                            <span style={{ color: "#fbbf24", marginLeft: "8px" }}>⏱ {getTimeLeft(table.quorumMetAt)}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <span style={{ color: "#c9a84c", fontSize: "1rem", flexShrink: 0 }}>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
