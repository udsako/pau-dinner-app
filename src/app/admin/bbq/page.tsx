"use client";
// src/app/admin/bbq/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BbqMenuItem, BbqOrder } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  COMPULSORY: "Compulsory",
  PROTEIN: "Protein (pick 1)",
  STARCH: "Starch (pick 1)",
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  COMPULSORY: { text: "#93c5fd", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
  PROTEIN: { text: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)" },
  STARCH: { text: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" },
};

export default function AdminBbqPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("orders");

  // Menu state
  const [menu, setMenu] = useState<BbqMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [addForm, setAddForm] = useState({ name: "", description: "", category: "COMPULSORY", quantity: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", quantity: "", isAvailable: true });
  const [menuMsg, setMenuMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Orders state
  const [orders, setOrders] = useState<BbqOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // ─── Auth guard (same pattern as dashboard) ──────────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem("pau_dinner_token");
    if (!t) {
      router.push("/admin/login");
      return;
    }
    setToken(t);
  }, [router]);

  // ─── Fetch menu ──────────────────────────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const res = await fetch("/api/bbq/menu");
      const data = await res.json();
      if (Array.isArray(data)) setMenu(data);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // ─── Fetch orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (deptFilter) params.set("department", deptFilter);
      const res = await fetch(`/api/bbq/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } finally {
      setOrdersLoading(false);
    }
  }, [search, deptFilter, token]);

  useEffect(() => { if (token) fetchMenu(); }, [fetchMenu, token]);
  useEffect(() => { if (activeTab === "orders" && token) fetchOrders(); }, [activeTab, fetchOrders, token]);

  // ─── Add menu item ───────────────────────────────────────────────────────────
  const handleAddItem = async () => {
    if (!addForm.name || !addForm.quantity) {
      return setMenuMsg({ type: "error", text: "Name and quantity are required." });
    }
    try {
      const res = await fetch("/api/bbq/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...addForm, quantity: Number(addForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) return setMenuMsg({ type: "error", text: data.error });
      setMenuMsg({ type: "success", text: `"${data.name}" added successfully!` });
      setAddForm({ name: "", description: "", category: "COMPULSORY", quantity: "" });
      fetchMenu();
    } catch {
      setMenuMsg({ type: "error", text: "Failed to add item." });
    }
  };

  // ─── Edit menu item ──────────────────────────────────────────────────────────
  const startEdit = (item: BbqMenuItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, description: item.description ?? "", quantity: String(item.quantity), isAvailable: item.isAvailable });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/bbq/menu/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...editForm, quantity: Number(editForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) return setMenuMsg({ type: "error", text: data.error });
      setEditingId(null);
      setMenuMsg({ type: "success", text: "Item updated." });
      fetchMenu();
    } catch {
      setMenuMsg({ type: "error", text: "Failed to update item." });
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/bbq/menu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return setMenuMsg({ type: "error", text: "Failed to delete item." });
      setMenuMsg({ type: "success", text: `"${name}" deleted.` });
      fetchMenu();
    } catch {
      setMenuMsg({ type: "error", text: "Failed to delete item." });
    }
  };

  // ─── CSV Export ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const compulsoryNames = menu.filter((i) => i.category === "COMPULSORY").map((i) => i.name).join(", ");
    const headers = ["#", "Name", "Department", "Protein", "Starch", "Compulsory Items", "Ordered At"];
    const rows = filteredOrders.map((o, idx) => [
      idx + 1,
      `"${o.studentName}"`,
      `"${o.department}"`,
      `"${o.proteinChoice?.name ?? ""}"`,
      `"${o.starchChoice?.name ?? ""}"`,
      `"${compulsoryNames}"`,
      new Date(o.orderedAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bbq-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Derived data ────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.studentName.toLowerCase().includes(q) ||
      o.department.toLowerCase().includes(q) ||
      o.proteinChoice?.name.toLowerCase().includes(q) ||
      o.starchChoice?.name.toLowerCase().includes(q);
    const matchDept = !deptFilter || o.department === deptFilter;
    return matchSearch && matchDept;
  });

  const uniqueDepts = Array.from(new Set(orders.map((o) => o.department))).sort();
  const proteinStats = orders.reduce<Record<string, number>>((acc, o) => {
    const name = o.proteinChoice?.name ?? "Unknown";
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const starchStats = orders.reduce<Record<string, number>>((acc, o) => {
    const name = o.starchChoice?.name ?? "Unknown";
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  if (!token) return null;

  // ─── Shared styles ───────────────────────────────────────────────────────────
  const inputSm = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: "2px",
    color: "var(--cream)",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--charcoal)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(26,21,16,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(201,168,76,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="text-xs uppercase tracking-widest flex items-center gap-1"
            style={{ color: "var(--text-muted)" }}
          >
            ← Dashboard
          </button>
          <span style={{ color: "rgba(201,168,76,0.3)" }}>|</span>
          <h1 className="text-xl font-light" style={{ fontFamily: "var(--font-cormorant)", color: "var(--gold)" }}>
            🔥 BBQ Management
          </h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex px-6 gap-1 pt-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        {(["orders", "menu"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2.5 text-sm font-medium capitalize transition-all"
            style={{
              borderBottom: activeTab === tab ? "2px solid var(--gold)" : "2px solid transparent",
              color: activeTab === tab ? "var(--gold)" : "var(--text-muted)",
              background: "transparent",
              marginBottom: "-1px",
            }}
          >
            {tab === "orders" ? "📋 Orders Table" : "🍖 Menu Items"}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ══ ORDERS TAB ══ */}
        {activeTab === "orders" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Orders", value: orders.length, icon: "📋" },
                { label: "Departments", value: uniqueDepts.length, icon: "🏛️" },
                ...Object.entries(proteinStats).map(([name, count]) => ({
                  label: name,
                  value: count,
                  icon: name.toLowerCase().includes("turkey") ? "🦃" : "🐟",
                })),
              ].map(({ label, value, icon }) => (
                <div key={label} className="p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: "4px" }}>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{icon} {label}</p>
                  <p className="text-3xl font-light" style={{ fontFamily: "var(--font-cormorant)", color: "var(--gold)" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Starch stats */}
            {Object.keys(starchStats).length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.entries(starchStats).map(([name, count]) => (
                  <div key={name} className="p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: "4px" }}>
                    <span style={{ fontSize: "20px" }}>{name.toLowerCase().includes("yam") ? "🍠" : "🍌"}</span>
                    <div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{name}</p>
                      <p className="text-2xl font-light" style={{ fontFamily: "var(--font-cormorant)", color: "var(--cream)" }}>{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters + Export */}
            <div className="flex flex-wrap gap-3 mb-5 items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, department..."
                style={{ ...inputSm, minWidth: "220px", flex: 1 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
              />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{ ...inputSm, cursor: "pointer" }}
              >
                <option value="">All Departments</option>
                {uniqueDepts.map((d) => (
                  <option key={d} value={d} style={{ background: "#1a1510" }}>{d}</option>
                ))}
              </select>
              <button onClick={() => fetchOrders()} className="px-4 py-2 text-xs uppercase tracking-widest" style={{ border: "1px solid rgba(201,168,76,0.3)", borderRadius: "2px", color: "var(--gold)" }}>
                Refresh
              </button>
              <button onClick={exportCSV} className="px-4 py-2 text-xs uppercase tracking-widest" style={{ background: "linear-gradient(135deg, var(--gold-dark), var(--gold))", borderRadius: "2px", color: "var(--charcoal)", fontWeight: 600 }}>
                ↓ Export CSV
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Showing {filteredOrders.length} of {orders.length} orders
            </p>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
                    {["#", "Name", "Department", "Protein", "Starch", "Time"].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs uppercase tracking-widest font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                        <div className="w-5 h-5 border-2 rounded-full mx-auto mb-2 animate-spin" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
                        Loading orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                        {orders.length === 0 ? "No BBQ orders yet." : "No orders match your search."}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, idx) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td className="py-3 px-3" style={{ color: "var(--text-muted)", fontSize: "12px" }}>{idx + 1}</td>
                        <td className="py-3 px-3 font-medium" style={{ color: "var(--cream)" }}>{order.studentName}</td>
                        <td className="py-3 px-3" style={{ color: "var(--text-muted)" }}>{order.department}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 text-xs" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "2px", color: "#fbbf24" }}>
                            {order.proteinChoice?.name ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 text-xs" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "2px", color: "#34d399" }}>
                            {order.starchChoice?.name ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(order.orderedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ MENU TAB ══ */}
        {activeTab === "menu" && (
          <div>
            {menuMsg && (
              <div className="mb-6 px-4 py-3 text-sm" style={{ background: menuMsg.type === "success" ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${menuMsg.type === "success" ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: "2px", color: menuMsg.type === "success" ? "#34d399" : "#fca5a5" }}>
                {menuMsg.text}
                <button onClick={() => setMenuMsg(null)} className="float-right opacity-50 hover:opacity-100">×</button>
              </div>
            )}

            {/* Add Item Form */}
            <div className="p-6 mb-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "4px" }}>
              <h2 className="text-xl font-light mb-5" style={{ fontFamily: "var(--font-cormorant)", color: "var(--cream)" }}>
                Add BBQ Menu Item
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Item Name *</label>
                  <input type="text" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Turkey, Fried Yam, Coleslaw" style={{ ...inputSm, width: "100%" }} onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Category *</label>
                  <select value={addForm.category} onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))} style={{ ...inputSm, width: "100%", cursor: "pointer" }}>
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val} style={{ background: "#1a1510" }}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Quantity / Stock *</label>
                  <input type="number" value={addForm.quantity} onChange={(e) => setAddForm((p) => ({ ...p, quantity: e.target.value }))} placeholder="e.g. 235" min={1} style={{ ...inputSm, width: "100%" }} onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Description (optional)</label>
                  <input type="text" value={addForm.description} onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description" style={{ ...inputSm, width: "100%" }} onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")} />
                </div>
              </div>
              <div className="mb-4 px-4 py-3 text-xs" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: "2px" }}>
                <strong style={{ color: "var(--gold)" }}>Category guide: </strong>
                <span style={{ color: "var(--text-muted)" }}>
                  <strong style={{ color: "#93c5fd" }}>Compulsory</strong> — included for everyone, student must confirm ·{" "}
                  <strong style={{ color: "#fbbf24" }}>Protein</strong> — pick 1 of 2 (max 2 options) ·{" "}
                  <strong style={{ color: "#34d399" }}>Starch</strong> — pick 1 of 2 (max 2 options)
                </span>
              </div>
              <button onClick={handleAddItem} className="px-6 py-2.5 text-sm font-medium uppercase tracking-widest" style={{ background: "linear-gradient(135deg, var(--gold-dark), var(--gold))", color: "var(--charcoal)", borderRadius: "2px" }}>
                + Add Item
              </button>
            </div>

            {/* Existing Items */}
            <h2 className="text-xl font-light mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "var(--cream)" }}>BBQ Menu Items</h2>
            {menuLoading ? (
              <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                <div className="w-5 h-5 border-2 rounded-full mx-auto mb-2 animate-spin" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
                Loading...
              </div>
            ) : menu.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>No BBQ menu items yet. Add one above.</p>
            ) : (
              <div className="grid gap-3">
                {(["COMPULSORY", "PROTEIN", "STARCH"] as const).map((cat) => {
                  const catItems = menu.filter((i) => i.category === cat);
                  if (catItems.length === 0) return null;
                  const colors = CATEGORY_COLORS[cat];
                  return (
                    <div key={cat}>
                      <p className="text-xs uppercase tracking-widest mb-2 px-1" style={{ color: colors.text }}>{CATEGORY_LABELS[cat]}</p>
                      <div className="grid gap-2 mb-5">
                        {catItems.map((item) => (
                          <div key={item.id} className="p-4" style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "4px" }}>
                            {editingId === item.id ? (
                              <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Name</label>
                                    <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} style={{ ...inputSm, width: "100%" }} onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")} />
                                  </div>
                                  <div>
                                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Stock</label>
                                    <input type="number" value={editForm.quantity} onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))} style={{ ...inputSm, width: "100%" }} onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")} />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
                                  <input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} style={{ ...inputSm, width: "100%" }} onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")} />
                                </div>
                                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
                                  <input type="checkbox" checked={editForm.isAvailable} onChange={(e) => setEditForm((p) => ({ ...p, isAvailable: e.target.checked }))} />
                                  Available
                                </label>
                                <div className="flex gap-2">
                                  <button onClick={() => handleSaveEdit(item.id)} className="px-4 py-1.5 text-xs uppercase tracking-widest" style={{ background: "var(--gold)", color: "var(--charcoal)", borderRadius: "2px" }}>Save</button>
                                  <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-xs uppercase tracking-widest" style={{ border: "1px solid rgba(201,168,76,0.3)", borderRadius: "2px", color: "var(--text-muted)" }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-medium text-sm" style={{ color: "var(--cream)" }}>{item.name}</span>
                                    {!item.isAvailable && <span className="text-xs px-1.5 py-0.5" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "2px", color: "#fca5a5" }}>Disabled</span>}
                                  </div>
                                  {item.description && <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
                                  <p className="text-xs" style={{ color: colors.text }}>{item.quantityRemaining} / {item.quantity} remaining</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button onClick={() => startEdit(item)} className="px-3 py-1 text-xs" style={{ border: "1px solid rgba(201,168,76,0.25)", borderRadius: "2px", color: "var(--gold)" }}>Edit</button>
                                  <button onClick={() => handleDeleteItem(item.id, item.name)} className="px-3 py-1 text-xs" style={{ border: "1px solid rgba(239,68,68,0.25)", borderRadius: "2px", color: "#fca5a5" }}>Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}