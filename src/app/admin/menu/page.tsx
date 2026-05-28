"use client";
// src/app/admin/menu/page.tsx

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { menuAPI, courseAPI } from "@/lib/api";
import type { MenuItem, Course } from "@/types";

const CATEGORIES = ["Soup", "Salad", "Main Course", "Side Dish", "Drink", "Dessert", "Snack", "Other"];
const COURSES: Course[] = ["STARTER", "MAIN", "DESSERT"];

const COURSE_CONFIG: Record<Course, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  STARTER: { label: "Starter", emoji: "🥗", color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)" },
  MAIN: { label: "Main Course", emoji: "🍽️", color: "#c9a84c", bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.3)" },
  DESSERT: { label: "Dessert", emoji: "🍰", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)" },
};

const EMPTY_FORM = { name: "", category: "Main Course", course: "MAIN" as Course, description: "", quantity: "", imageUrl: "" };

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingCourse, setTogglingCourse] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [menuRes, courseRes]: any[] = await Promise.all([
        menuAPI.getAll(),
        courseAPI.getActive(),
      ]);
      setMenu(menuRes.menu || []);
      setActiveCourse(courseRes.activeCourse || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSetCourse = async (course: Course | null) => {
    setTogglingCourse(true);
    try {
      const newCourse = activeCourse === course ? null : course;
      await courseAPI.setActive(newCourse);
      setActiveCourse(newCourse);
      toast.success(newCourse ? `${COURSE_CONFIG[newCourse].label} is now open for ordering!` : "Ordering paused.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTogglingCourse(false);
    }
  };

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
      fetchData();
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
      course: item.course,
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
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await menuAPI.delete(id);
      toast.success("Item deleted.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>Management</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", color: "#f5f0e8" }}>Menu & Course Control</h1>
        </div>
        <button className="btn-gold" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}>
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* ── Course Control Panel ── */}
      <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#f5f0e8", marginBottom: "4px" }}>
            Course Control
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#9b93b0" }}>
            Toggle which course students can currently order from. Only one course can be active at a time.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {COURSES.map((course) => {
            const config = COURSE_CONFIG[course];
            const isActive = activeCourse === course;
            return (
              <button
                key={course}
                onClick={() => handleSetCourse(course)}
                disabled={togglingCourse}
                style={{
                  padding: "16px", borderRadius: "10px", border: "none", cursor: "pointer",
                  background: isActive ? config.bg : "rgba(255,255,255,0.04)",
                  outline: isActive ? `2px solid ${config.border}` : "2px solid transparent",
                  transition: "all 0.2s ease", opacity: togglingCourse ? 0.7 : 1,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                }}
              >
                <span style={{ fontSize: "28px" }}>{config.emoji}</span>
                <span style={{ fontWeight: 600, color: isActive ? config.color : "#9b93b0", fontSize: "0.85rem" }}>
                  {config.label}
                </span>
                <span style={{
                  fontSize: "0.68rem", padding: "3px 10px", borderRadius: "20px",
                  background: isActive ? `${config.color}22` : "rgba(255,255,255,0.05)",
                  color: isActive ? config.color : "#9b93b0",
                  border: `1px solid ${isActive ? config.border : "transparent"}`,
                  fontWeight: 600, letterSpacing: "0.05em",
                }}>
                  {isActive ? "● OPEN" : "○ CLOSED"}
                </span>
              </button>
            );
          })}
        </div>

        {activeCourse && (
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => handleSetCourse(null)}
              disabled={togglingCourse}
              style={{
                background: "rgba(224,82,82,0.1)", color: "#e05252",
                border: "1px solid rgba(224,82,82,0.3)", borderRadius: "8px",
                padding: "8px 20px", cursor: "pointer", fontSize: "0.82rem",
                fontFamily: "var(--font-body)", fontWeight: 500,
              }}
            >
              ⏸ Pause All Ordering
            </button>
          </div>
        )}
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
              <label className="label">Course *</label>
              <select className="input-field" value={form.course} onChange={(e) => handleChange("course", e.target.value)} style={{ cursor: "pointer" }}>
                {COURSES.map((c) => <option key={c} value={c}>{COURSE_CONFIG[c].emoji} {COURSE_CONFIG[c].label}</option>)}
              </select>
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

      {/* Menu grouped by course then category */}
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
        COURSES.map((course) => {
          const courseItems = menu.filter((item) => item.course === course);
          if (courseItems.length === 0) return null;
          const config = COURSE_CONFIG[course];
          const isActive = activeCourse === course;

          const grouped = courseItems.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
          }, {} as Record<string, MenuItem[]>);

          return (
            <div key={course} style={{ marginBottom: "40px" }}>
              {/* Course header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px",
                padding: "12px 16px", borderRadius: "10px",
                background: isActive ? config.bg : "rgba(255,255,255,0.03)",
                border: `1px solid ${isActive ? config.border : "rgba(255,255,255,0.06)"}`,
              }}>
                <span style={{ fontSize: "20px" }}>{config.emoji}</span>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: isActive ? config.color : "#f5f0e8", flex: 1 }}>
                  {config.label}
                </h2>
                <span style={{
                  fontSize: "0.68rem", padding: "3px 10px", borderRadius: "20px",
                  background: isActive ? `${config.color}22` : "rgba(255,255,255,0.05)",
                  color: isActive ? config.color : "#9b93b0",
                  fontWeight: 700, letterSpacing: "0.06em",
                }}>
                  {isActive ? "● OPEN" : "CLOSED"}
                </span>
              </div>

              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "0.75rem", color: "#9b93b0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px", paddingLeft: "4px" }}>
                    {category}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {items.map((item) => (
                      <div key={item.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", opacity: item.isAvailable ? 1 : 0.5 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                            <p style={{ fontWeight: 500, color: "#f5f0e8" }}>{item.name}</p>
                            {!item.isAvailable && <span className="badge badge-collecting">Disabled</span>}
                            {item.quantity <= 5 && item.quantity > 0 && item.isAvailable && <span className="badge badge-quorum">Low stock</span>}
                            {item.quantity === 0 && <span style={{ fontSize: "0.7rem", color: "#e05252", background: "rgba(224,82,82,0.1)", padding: "2px 8px", borderRadius: "10px" }}>Sold out</span>}
                          </div>
                          {item.description && <p style={{ fontSize: "0.78rem", color: "#9b93b0" }}>{item.description}</p>}
                        </div>

                        <div style={{ textAlign: "center", minWidth: "52px" }}>
                          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: item.quantity <= 5 ? "#fbbf24" : "#c9a84c" }}>{item.quantity}</p>
                          <p style={{ fontSize: "0.6rem", color: "#9b93b0", letterSpacing: "0.05em" }}>LEFT</p>
                        </div>

                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <button className="btn-ghost" onClick={() => handleEdit(item)} style={{ fontSize: "0.75rem", padding: "5px 10px" }}>Edit</button>
                          <button
                            onClick={() => handleToggle(item)}
                            style={{
                              padding: "5px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
                              background: item.isAvailable ? "rgba(224,82,82,0.1)" : "rgba(52,211,153,0.1)",
                              color: item.isAvailable ? "#e05252" : "#34d399",
                              fontSize: "0.75rem", fontFamily: "var(--font-body)",
                            }}
                          >
                            {item.isAvailable ? "Disable" : "Enable"}
                          </button>
                          <button className="btn-danger" onClick={() => handleDelete(item.id, item.name)} style={{ fontSize: "0.75rem", padding: "5px 10px" }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
