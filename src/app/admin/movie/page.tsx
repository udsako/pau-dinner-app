"use client";
// src/app/admin/movie/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { MovieMenuItem, MovieOrder } from "@/types";

export default function AdminMoviePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");

  const [menu, setMenu] = useState<MovieMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [addForm, setAddForm] = useState({ name: "", description: "", quantity: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", quantity: "", isAvailable: true });

  const [orders, setOrders] = useState<MovieOrder[]>([]);
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
      const res = await fetch("/api/movie/menu");
      const data = await res.json();
      if (Array.isArray(data)) setMenu(data);
      else toast.error("Failed to load menu.");
    } catch { toast.error("Network error."); }
    finally { setMenuLoading(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (deptFilter) params.set("department", deptFilter);
      const res = await fetch(`/api/movie/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch { toast.error("Failed to load orders."); }
    finally { setOrdersLoading(false); }
  }, [search, deptFilter, token]);

  useEffect(() => { if (token) fetchMenu(); }, [fetchMenu, token]);
  useEffect(() => { if (activeTab === "orders" && token) fetchOrders(); }, [activeTab, fetchOrders, token]);

  const handleAddItem = async () => {
    if (!addForm.name || !addForm.quantity) { toast.error("Name and quantity are required."); return; }
    try {
      const res = await fetch("/api/movie/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, quantity: Number(addForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to add."); return; }
      toast.success(`"${data.name}" added!`);
      setAddForm({ name: "", description: "", quantity: "" });
      fetchMenu();
    } catch { toast.error("Failed to add item."); }
  };

  const startEdit = (item: MovieMenuItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, description: item.description ?? "", quantity: String(item.quantity), isAvailable: item.isAvailable });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/movie/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, quantity: Number(editForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to update."); return; }
      toast.success("Item updated.");
      setEditingId(null);
      fetchMenu();
    } catch { toast.error("Failed to update."); }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const t = toast.loading("Deleting...");
    try {
      const res = await fetch(`/api/movie/menu/${id}`, { method: "DELETE" });
      toast.dismiss(t);
      if (!res.ok) { toast.error("Delete failed."); return; }
      toast.success(`"${name}" deleted.`);
      fetchMenu();
    } catch { toast.dismiss(t); toast.error("Delete failed."); }
  };

  const handleReset = async () => {
    if (!window.confirm("⚠️ This will permanently delete ALL Movie Night orders. This affects everyone. Are you sure?")) return;
    if (!window.confirm("Second confirmation — are you absolutely sure?")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/movie/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Reset failed."); return; }
      toast.success(data.message);
      setOrders([]);
      fetchMenu();
      fetchOrders();
    } catch { toast.error("Reset failed."); }
    finally { setResetting(false); }
  };

  const exportCSV = () => {
    const headers = ["#", "Name", "Department", "Ordered At"];
    const rows = filteredOrders.map((o, idx) => [
      idx + 1, `"${o.studentName}"`, `"${o.department}"`,
      new Date(o.orderedAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movie-night-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.studentName.toLowerCase().includes(q) || o.department.toLowerCase().includes(q);
    const matchDept = !deptFilter || o.department === deptFilter;
    return matchSearch && matchDept;
  });

  const uniqueDepts = Array.from(new Set(orders.map((o) => o.department))).sort();

  if (!token) return null;

  const inputSm = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: "2px", color: "var(--cream)" as const, padding: "8px 12px",
    fontSize: "13px", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Tabs */}
      <div className="flex px-6 gap-1 pt-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        {(["orders", "menu"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-5 py-2.5 text-sm font-medium capitalize transition-all"
            style={{
              borderBottom: activeTab === tab ? "2px solid var(--gold)" : "2px solid transparent",
              color: activeTab === tab ? "var(--gold)" : "var(--text-muted)",
              background: "transparent", marginBottom: "-1px",
            }}>
            {tab === "orders" ? "📋 Orders Table" : "🎬 Menu Items"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>

        {/* ══ ORDERS TAB ══ */}
        {activeTab === "orders" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Orders", value: orders.length, icon: "🎬" },
                { label: "Departments", value: uniqueDepts.length, icon: "🏛️" },
                { label: "Remaining Spots", value: 235 - orders.length, icon: "🎟️" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="card" style={{ padding: "16px" }}>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9b93b0", marginBottom: "6px" }}>{icon} {label}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 600, color: "#c9a84c" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Filters + Actions */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, department..."
                style={{ ...inputSm, minWidth: "220px", flex: 1 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")} />
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ ...inputSm, cursor: "pointer" }}>
                <option value="">All Departments</option>
                {uniqueDepts.map((d) => <option key={d} value={d} style={{ background: "#1a1510" }}>{d}</option>)}
              </select>
              <button onClick={() => fetchOrders()} className="btn-ghost" style={{ fontSize: "0.8rem" }}>Refresh</button>
              <button onClick={exportCSV} className="btn-gold" style={{ fontSize: "0.8rem" }}>↓ Export CSV</button>
              <button onClick={handleReset} disabled={resetting} style={{
                background: "rgba(224,82,82,0.1)", color: "#e05252",
                border: "1px solid rgba(224,82,82,0.3)", borderRadius: "8px",
                padding: "8px 14px", cursor: resetting ? "not-allowed" : "pointer",
                fontSize: "0.8rem", fontFamily: "var(--font-body)", fontWeight: 500,
                opacity: resetting ? 0.7 : 1, whiteSpace: "nowrap",
              }}>
                {resetting ? "Resetting..." : "🔄 Reset Orders"}
              </button>
            </div>

            <p style={{ fontSize: "0.75rem", color: "#9b93b0", marginBottom: "16px" }}>
              Showing {filteredOrders.length} of {orders.length} orders
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
                    {["#", "Name", "Department", "Time"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b93b0", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px", color: "#9b93b0" }}>Loading orders...</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px", color: "#9b93b0" }}>{orders.length === 0 ? "No Movie Night orders yet." : "No orders match your search."}</td></tr>
                  ) : (
                    filteredOrders.map((order, idx) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td style={{ padding: "10px 12px", color: "#9b93b0", fontSize: "0.75rem" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 12px", color: "#f5f0e8", fontWeight: 500 }}>{order.studentName}</td>
                        <td style={{ padding: "10px 12px", color: "#9b93b0" }}>{order.department}</td>
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
            {/* Add Item Form */}
            <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#e8c97e", marginBottom: "20px" }}>
                Add Movie Night Item
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label className="label">Item Name *</label>
                  <input type="text" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Popcorn, Soft Drink" className="input-field" />
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
              <button className="btn-gold" onClick={handleAddItem}>+ Add Item</button>
            </div>

            {/* Existing Items */}
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#f5f0e8", marginBottom: "16px" }}>
              Movie Night Items
            </h2>

            {menuLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#9b93b0" }}>Loading...</div>
            ) : menu.length === 0 ? (
              <div className="card" style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ color: "#9b93b0" }}>No items yet. Add popcorn and drink above.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {menu.map((item) => (
                  <div key={item.id} className="card" style={{ padding: "14px 18px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}>
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
                          <p style={{ fontSize: "0.75rem", color: "#a78bfa", marginTop: "2px" }}>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}