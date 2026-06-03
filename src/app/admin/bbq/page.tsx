"use client";
// src/app/admin/bbq/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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

  const [menu, setMenu] = useState<BbqMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [addForm, setAddForm] = useState({ name: "", description: "", category: "COMPULSORY", quantity: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", quantity: "", isAvailable: true });

  const [orders, setOrders] = useState<BbqOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("pau_dinner_token");
    if (!t) { router.push("/admin/login"); return; }
    setToken(t);
  }, [router]);

  const fetchMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const res = await fetch("/api/bbq/menu");
      const data = await res.json();
      if (Array.isArray(data)) setMenu(data);
      else toast.error("Failed to load menu.");
    } catch {
      toast.error("Network error loading menu.");
    } finally {
      setMenuLoading(false);
    }
  }, []);

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
    } catch {
      toast.error("Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, [search, deptFilter, token]);

  useEffect(() => { if (token) fetchMenu(); }, [fetchMenu, token]);
  useEffect(() => { if (activeTab === "orders" && token) fetchOrders(); }, [activeTab, fetchOrders, token]);

  const handleAddItem = async () => {
    if (!addForm.name || !addForm.quantity) {
      toast.error("Name and quantity are required.");
      return;
    }
    try {
      const res = await fetch("/api/bbq/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, quantity: Number(addForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to add item."); return; }
      toast.success(`"${data.name}" added!`);
      setAddForm({ name: "", description: "", category: "COMPULSORY", quantity: "" });
      fetchMenu();
    } catch {
      toast.error("Failed to add item.");
    }
  };

  const startEdit = (item: BbqMenuItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, description: item.description ?? "", quantity: String(item.quantity), isAvailable: item.isAvailable });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/bbq/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, quantity: Number(editForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to update."); return; }
      toast.success("Item updated.");
      setEditingId(null);
      fetchMenu();
    } catch {
      toast.error("Failed to update item.");
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const loadingToast = toast.loading("Deleting...");
    try {
      const res = await fetch(`/api/bbq/menu/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      toast.dismiss(loadingToast);
      if (!res.ok) { toast.error(data.error || `Delete failed (${res.status})`); return; }
      toast.success(`"${name}" deleted.`);
      fetchMenu();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Network error — delete failed.");
    }
  };

  const handleReset = async () => {
    if (!window.confirm("⚠️ This will permanently delete ALL BBQ orders from the database. This affects everyone who has ordered. Are you sure?")) return;
    if (!window.confirm("Second confirmation — are you absolutely sure? This cannot be undone.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/bbq/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Reset failed."); return; }
      toast.success(data.message);
      setOrders([]);
      fetchMenu();
      fetchOrders();
    } catch {
      toast.error("Reset failed.");
    } finally {
      setResetting(false);
    }
  };

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

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.studentName.toLowerCase().includes(q) || o.department.toLowerCase().includes(q) || o.proteinChoice?.name.toLowerCase().includes(q) || o.starchChoice?.name.toLowerCase().includes(q);
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
    <div style={{ minHeight: "100vh" }}>
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

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>

        {/* ══ ORDERS TAB ══ */}
        {activeTab === "orders" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Orders", value: orders.length, icon: "📋" },
                { label: "Departments", value: uniqueDepts.length, icon: "🏛️" },
                ...Object.entries(proteinStats).map(([name, count]) => ({
                  label: name, value: count,
                  icon: name.toLowerCase().includes("turkey") ? "🦃" : "🐟",
                })),
              ].map(({ label, value, icon }) => (
                <div key={label} className="card" style={{ padding: "16px" }}>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9b93b0", marginBottom: "6px" }}>{icon} {label}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 600, color: "#c9a84c" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Starch stats */}
            {Object.keys(starchStats).length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.entries(starchStats).map(([name, count]) => (
                  <div key={name} className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{name.toLowerCase().includes("yam") ? "🍠" : "🍌"}</span>
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "#9b93b0" }}>{name}</p>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#f5f0e8" }}>{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters + Export + Reset */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, department..."
                style={{ ...inputSm, minWidth: "220px", flex: 1 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
              />
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ ...inputSm, cursor: "pointer" }}>
                <option value="">All Departments</option>
                {uniqueDepts.map((d) => <option key={d} value={d} style={{ background: "#1a1510" }}>{d}</option>)}
              </select>
              <button onClick={() => fetchOrders()} className="btn-ghost" style={{ fontSize: "0.8rem" }}>
                Refresh
              </button>
              <button onClick={exportCSV} className="btn-gold" style={{ fontSize: "0.8rem" }}>
                ↓ Export CSV
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                style={{
                  background: "rgba(224,82,82,0.1)",
                  color: "#e05252",
                  border: "1px solid rgba(224,82,82,0.3)",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  cursor: resetting ? "not-allowed" : "pointer",
                  fontSize: "0.8rem",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  opacity: resetting ? 0.7 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {resetting ? "Resetting..." : "🔄 Reset BBQ Orders"}
              </button>
            </div>

            <p style={{ fontSize: "0.75rem", color: "#9b93b0", marginBottom: "16px" }}>
              Showing {filteredOrders.length} of {orders.length} orders
            </p>

            {/* Orders Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
                    {["#", "Name", "Department", "Protein", "Starch", "Time"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b93b0", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "#9b93b0" }}>Loading orders...</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "#9b93b0" }}>{orders.length === 0 ? "No BBQ orders yet." : "No orders match your search."}</td></tr>
                  ) : (
                    filteredOrders.map((order, idx) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td style={{ padding: "10px 12px", color: "#9b93b0", fontSize: "0.75rem" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 12px", color: "#f5f0e8", fontWeight: 500 }}>{order.studentName}</td>
                        <td style={{ padding: "10px 12px", color: "#9b93b0" }}>{order.department}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "4px", padding: "2px 8px", fontSize: "0.75rem", color: "#fbbf24" }}>
                            {order.proteinChoice?.name ?? "—"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "4px", padding: "2px 8px", fontSize: "0.75rem", color: "#34d399" }}>
                            {order.starchChoice?.name ?? "—"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#9b93b0" }}>
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
            <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#e8c97e", marginBottom: "20px" }}>
                Add BBQ Menu Item
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label className="label">Item Name *</label>
                  <input type="text" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Turkey, Fried Yam, Coleslaw" className="input-field" />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select value={addForm.category} onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))} className="input-field" style={{ cursor: "pointer" }}>
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val} style={{ background: "#1a1510" }}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Quantity / Stock *</label>
                  <input type="number" value={addForm.quantity} onChange={(e) => setAddForm((p) => ({ ...p, quantity: e.target.value }))} placeholder="e.g. 235" min={1} className="input-field" />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <input type="text" value={addForm.description} onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description" className="input-field" />
                </div>
              </div>
              <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: "8px", fontSize: "0.78rem", color: "#9b93b0" }}>
                <strong style={{ color: "#c9a84c" }}>Category guide: </strong>
                <strong style={{ color: "#93c5fd" }}>Compulsory</strong> — everyone gets, must confirm ·{" "}
                <strong style={{ color: "#fbbf24" }}>Protein</strong> — pick 1 of 2 (max 2) ·{" "}
                <strong style={{ color: "#34d399" }}>Starch</strong> — pick 1 of 2 (max 2)
              </div>
              <button className="btn-gold" onClick={handleAddItem}>+ Add Item</button>
            </div>

            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#f5f0e8", marginBottom: "16px" }}>
              BBQ Menu Items
            </h2>

            {menuLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#9b93b0" }}>Loading...</div>
            ) : menu.length === 0 ? (
              <div className="card" style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ color: "#9b93b0" }}>No BBQ menu items yet. Add one above.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(["COMPULSORY", "PROTEIN", "STARCH"] as const).map((cat) => {
                  const catItems = menu.filter((i) => i.category === cat);
                  if (catItems.length === 0) return null;
                  const colors = CATEGORY_COLORS[cat];
                  return (
                    <div key={cat} style={{ marginBottom: "24px" }}>
                      <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: colors.text, marginBottom: "8px", paddingLeft: "4px" }}>
                        {CATEGORY_LABELS[cat]}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {catItems.map((item) => (
                          <div key={item.id} className="card" style={{ padding: "14px 18px", background: colors.bg, border: `1px solid ${colors.border}` }}>
                            {editingId === item.id ? (
                              <div style={{ display: "grid", gap: "12px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                  <div>
                                    <label className="label">Name</label>
                                    <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="input-field" />
                                  </div>
                                  <div>
                                    <label className="label">Stock</label>
                                    <input type="number" value={editForm.quantity} onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))} className="input-field" />
                                  </div>
                                </div>
                                <div>
                                  <label className="label">Description</label>
                                  <input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="input-field" />
                                </div>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#9b93b0", cursor: "pointer" }}>
                                  <input type="checkbox" checked={editForm.isAvailable} onChange={(e) => setEditForm((p) => ({ ...p, isAvailable: e.target.checked }))} />
                                  Available
                                </label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button className="btn-gold" onClick={() => handleSaveEdit(item.id)} style={{ fontSize: "0.8rem", padding: "6px 16px" }}>Save</button>
                                  <button className="btn-ghost" onClick={() => setEditingId(null)} style={{ fontSize: "0.8rem", padding: "6px 16px" }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                                    <p style={{ fontWeight: 500, color: "#f5f0e8" }}>{item.name}</p>
                                    {!item.isAvailable && <span style={{ fontSize: "0.7rem", color: "#e05252", background: "rgba(224,82,82,0.1)", padding: "2px 8px", borderRadius: "10px" }}>Disabled</span>}
                                  </div>
                                  {item.description && <p style={{ fontSize: "0.78rem", color: "#9b93b0" }}>{item.description}</p>}
                                  <p style={{ fontSize: "0.75rem", color: colors.text, marginTop: "2px" }}>
                                    {item.quantityRemaining} / {item.quantity} remaining
                                  </p>
                                </div>
                                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                  <button className="btn-ghost" onClick={() => startEdit(item)} style={{ fontSize: "0.75rem", padding: "5px 12px" }}>Edit</button>
                                  <button className="btn-danger" onClick={() => handleDeleteItem(item.id, item.name)} style={{ fontSize: "0.75rem", padding: "5px 12px" }}>Delete</button>
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