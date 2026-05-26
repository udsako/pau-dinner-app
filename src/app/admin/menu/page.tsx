"use client";
// src/app/admin/menu/page.tsx

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { menuAPI } from "@/lib/api";
import type { MenuItem } from "@/types";

const CATEGORIES = ["Main Course", "Side Dish", "Drink", "Dessert", "Snack", "Other"];

const EMPTY_FORM = { name: "", category: "Main Course", description: "", quantity: "", imageUrl: "" };

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      const res: any = await menuAPI.getAll();
      setMenu(res.menu || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name || !form.quantity) {
      toast.error("Name and quantity are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await menuAPI.update(editingId, form);
        toast.success("Item updated.");
      } else {
        await menuAPI.create(form);
        toast.success("Item added to menu.");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchMenu();
    } catch (err: any) {
      toast.error(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || "",
      quantity: String(item.quantity),
      imageUrl: item.imageUrl || "",
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = async (item: MenuItem) => {
    try {
      await menuAPI.update(item.id, { isAvailable: !item.isAvailable });
      toast.success(item.isAvailable ? "Item disabled." : "Item enabled.");
      fetchMenu();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await menuAPI.delete(id);
      toast.success("Item deleted.");
      fetchMenu();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const grouped = menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div style={{ padding: "40px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>
            Management
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", color: "#f5f0e8" }}>
            Menu Items
          </h1>
        </div>
        <button className="btn-gold" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}>
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card animate-in" style={{ padding: "28px", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#e8c97e", marginBottom: "20px" }}>
            {editingId ? "Edit Item" : "New Menu Item"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="label">Name *</label>
              <input className="input-field" type="text" placeholder="e.g. Jollof Rice" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input-field" value={form.category} onChange={(e) => handleChange("category", e.target.value)} style={{ cursor: "pointer" }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantity (servings) *</label>
              <input className="input-field" type="number" min="0" placeholder="e.g. 100" value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)} />
            </div>
            <div>
              <label className="label">Image URL (optional)</label>
              <input className="input-field" type="url" placeholder="https://..." value={form.imageUrl} onChange={(e) => handleChange("imageUrl", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Description (optional)</label>
              <input className="input-field" type="text" placeholder="Short description shown to students" value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button className="btn-gold" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
            </button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Menu grouped by category */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "10px" }} />)}
        </div>
      ) : menu.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🍽️</p>
          <p style={{ color: "#9b93b0" }}>No menu items yet. Add your first item above.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#e8c97e", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
              {category}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((item) => (
                <div key={item.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", opacity: item.isAvailable ? 1 : 0.5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <p style={{ fontWeight: 500, color: "#f5f0e8" }}>{item.name}</p>
                      {!item.isAvailable && (
                        <span className="badge badge-collecting">Disabled</span>
                      )}
                      {item.quantity <= 5 && item.quantity > 0 && item.isAvailable && (
                        <span className="badge badge-quorum">Low stock</span>
                      )}
                      {item.quantity === 0 && (
                        <span style={{ fontSize: "0.7rem", color: "#e05252", background: "rgba(224,82,82,0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                          Sold out
                        </span>
                      )}
                    </div>
                    {item.description && <p style={{ fontSize: "0.8rem", color: "#9b93b0" }}>{item.description}</p>}
                  </div>

                  <div style={{ textAlign: "center", minWidth: "60px" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: item.quantity <= 5 ? "#fbbf24" : "#c9a84c" }}>{item.quantity}</p>
                    <p style={{ fontSize: "0.65rem", color: "#9b93b0", letterSpacing: "0.05em" }}>LEFT</p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button className="btn-ghost" onClick={() => handleEdit(item)} style={{ fontSize: "0.78rem", padding: "6px 12px" }}>Edit</button>
                    <button
                      onClick={() => handleToggle(item)}
                      style={{
                        padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                        background: item.isAvailable ? "rgba(224,82,82,0.1)" : "rgba(52,211,153,0.1)",
                        color: item.isAvailable ? "#e05252" : "#34d399",
                        fontSize: "0.78rem", fontFamily: "var(--font-body)",
                      }}
                    >
                      {item.isAvailable ? "Disable" : "Enable"}
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(item.id, item.name)} style={{ fontSize: "0.78rem", padding: "6px 12px" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
