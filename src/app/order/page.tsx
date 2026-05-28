"use client";
// src/app/order/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { MenuItem, Course } from "@/types";
import { menuAPI, ordersAPI, courseAPI } from "@/lib/api";

const COURSE_LABELS: Record<Course, { label: string; emoji: string; next: string }> = {
  STARTER: { label: "Starter", emoji: "🥗", next: "Main Course" },
  MAIN: { label: "Main Course", emoji: "🍽️", next: "Dessert" },
  DESSERT: { label: "Dessert", emoji: "🍰", next: "" },
};

export default function OrderPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes: any = await courseAPI.getActive();
        const course = courseRes.activeCourse as Course | null;
        setActiveCourse(course);

        if (course) {
          const menuRes: any = await menuAPI.getAll(course);
          setMenu(menuRes.grouped || {});
        }
      } catch {
        toast.error("Failed to load menu. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelect = (category: string, itemId: string) => {
    setSelected((prev) => ({ ...prev, [category]: itemId }));
  };

  const handleSubmit = async () => {
    if (!studentName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    const tableNum = parseInt(tableNumber);
    if (!tableNumber || isNaN(tableNum) || tableNum < 1 || tableNum > 24) {
      toast.error("Please enter a valid table number (1–24).");
      return;
    }
    const selectedItems = Object.values(selected).filter(Boolean);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item.");
      return;
    }

    setSubmitting(true);
    try {
      const res: any = await ordersAPI.place({
        studentName: studentName.trim(),
        tableNumber: tableNum,
        items: selectedItems.map((id) => ({ menuItemId: id })),
        specialNotes: specialNotes.trim() || undefined,
      });
      toast.success("Order placed!");
      router.push(
        `/confirmation?orderId=${res.order.id}&name=${encodeURIComponent(res.order.studentName)}&table=${tableNum}&course=${activeCourse}`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to place order.");
      setSubmitting(false);
    }
  };

  const courseInfo = activeCourse ? COURSE_LABELS[activeCourse] : null;

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 70%)", padding: "0 0 60px" }}>
      <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 20px 32px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "8px" }}>
          Pan-Atlantic University · Final Year Dinner
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 600, color: "#f5f0e8", marginBottom: "12px" }}>
          Place Your Order
        </h1>
        {courseInfo && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "20px", padding: "8px 20px",
          }}>
            <span style={{ fontSize: "18px" }}>{courseInfo.emoji}</span>
            <span style={{ color: "#e8c97e", fontWeight: 600, fontSize: "0.9rem" }}>
              {courseInfo.label} is now open
            </span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 20px" }}>

        {/* Ordering closed state */}
        {!loading && !activeCourse && (
          <div className="card" style={{ padding: "48px", textAlign: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "3rem", marginBottom: "16px" }}>⏸</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#f5f0e8", marginBottom: "12px" }}>
              Ordering is Closed
            </h2>
            <p style={{ color: "#9b93b0", lineHeight: 1.7 }}>
              Ordering is not open yet. Please wait for the announcement before placing your order.
            </p>
            <p style={{ color: "#c9a84c", fontSize: "0.85rem", marginTop: "16px", fontStyle: "italic" }}>
              Enjoy the evening — we'll let you know when it's time!
            </p>
          </div>
        )}

        {/* Active course ordering */}
        {!loading && activeCourse && (
          <>
            {/* Name + Table */}
            <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Your Full Name *</label>
                  <input className="input-field" type="text" placeholder="e.g. Adaeze Okonkwo" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Table Number *</label>
                  <input className="input-field" type="number" min="1" max="24" placeholder="1 – 24" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "12px 16px", width: "100%" }}>
                    <p style={{ fontSize: "0.72rem", color: "#9b93b0", marginBottom: "2px" }}>Find your table number on</p>
                    <p style={{ fontSize: "0.82rem", color: "#c9a84c", fontWeight: 500 }}>your place card 🪧</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            {Object.keys(menu).length === 0 ? (
              <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                <p style={{ color: "#9b93b0" }}>No items available for this course yet.</p>
              </div>
            ) : (
              Object.entries(menu).map(([category, items]) => (
                <div key={category} className="card" style={{ padding: "24px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#e8c97e" }}>{category}</h2>
                    <span style={{ fontSize: "0.7rem", color: "#9b93b0", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "10px" }}>Pick one</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(items as MenuItem[]).map((item) => {
                      const isSelected = selected[category] === item.id;
                      const isUnavailable = !item.isAvailable;
                      const isLow = item.quantity <= 5 && item.quantity > 0;
                      return (
                        <button
                          key={item.id}
                          onClick={() => !isUnavailable && handleSelect(category, item.id)}
                          disabled={isUnavailable}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "14px 16px", borderRadius: "10px", border: "none",
                            cursor: isUnavailable ? "not-allowed" : "pointer",
                            background: isSelected ? "rgba(201,168,76,0.15)" : isUnavailable ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                            outline: isSelected ? "1.5px solid rgba(201,168,76,0.6)" : "1.5px solid transparent",
                            transition: "all 0.2s ease", opacity: isUnavailable ? 0.4 : 1, textAlign: "left",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 500, color: isUnavailable ? "#9b93b0" : "#f5f0e8", marginBottom: item.description ? "2px" : 0, textDecoration: isUnavailable ? "line-through" : "none" }}>
                              {item.name}
                            </p>
                            {item.description && <p style={{ fontSize: "0.8rem", color: "#9b93b0" }}>{item.description}</p>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "12px" }}>
                            {isLow && !isUnavailable && (
                              <span style={{ fontSize: "0.7rem", color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.2)" }}>
                                {item.quantity} left
                              </span>
                            )}
                            {isUnavailable && (
                              <span style={{ fontSize: "0.7rem", color: "#e05252", background: "rgba(224,82,82,0.1)", padding: "2px 8px", borderRadius: "10px" }}>Sold out</span>
                            )}
                            <div style={{
                              width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                              border: isSelected ? "none" : "2px solid rgba(201,168,76,0.3)",
                              background: isSelected ? "#c9a84c" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {isSelected && <span style={{ fontSize: "11px", color: "#0d0826", fontWeight: 700 }}>✓</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Special notes */}
            <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
              <label className="label">Special Notes (Optional)</label>
              <textarea className="input-field" rows={3} placeholder="Allergies, dietary restrictions..." value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} style={{ resize: "vertical" }} />
            </div>

            <button className="btn-gold" onClick={handleSubmit} disabled={submitting} style={{ width: "100%", fontSize: "1rem", padding: "16px", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Placing Order..." : `Place My ${courseInfo?.label} Order →`}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9b93b0", marginTop: "16px", lineHeight: 1.6 }}>
              Your selection is locked in immediately. Food is served on a first-come, first-served basis.
            </p>
          </>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "12px" }} />)}
          </div>
        )}
      </div>
    </main>
  );
}
