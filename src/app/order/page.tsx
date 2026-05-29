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

const COURSE_ORDER: Course[] = ["STARTER", "MAIN", "DESSERT"];

export default function OrderPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [openCourses, setOpenCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null); // what this student should order next
  const [orderedCourses, setOrderedCourses] = useState<Course[]>([]); // what they've already ordered
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameEntered, setNameEntered] = useState(false);

  // Step 1: Load open courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courseRes: any = await courseAPI.getActive();
        setOpenCourses(courseRes.openCourses || []);

        // Pre-fill from localStorage
        const savedName = localStorage.getItem("pau_dinner_name");
        const savedTable = localStorage.getItem("pau_dinner_table");
        if (savedName) setStudentName(savedName);
        if (savedTable) setTableNumber(savedTable);
      } catch {
        toast.error("Failed to load. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Step 2: When student enters name + table, check what course they should order
  const checkStudentStatus = async () => {
    const name = studentName.trim();
    const tableNum = parseInt(tableNumber);

    if (!name) { toast.error("Please enter your full name."); return; }
    if (!tableNumber || isNaN(tableNum) || tableNum < 1 || tableNum > 24) {
      toast.error("Please enter a valid table number (1–24)."); return;
    }

    setCheckingStatus(true);
    try {
      // Check what they've already ordered
      const res = await fetch(`/api/orders/student-status?studentName=${encodeURIComponent(name)}&tableNumber=${tableNum}`);
      const data = await res.json();
      const alreadyOrdered: Course[] = data.orderedCourses || [];
      setOrderedCourses(alreadyOrdered);

      // Find what course they should order next
      let nextCourse: Course | null = null;
      for (const course of COURSE_ORDER) {
        if (!openCourses.includes(course)) continue;
        if (alreadyOrdered.includes(course)) continue;

        // Check sequential: do they have all previous courses?
        const courseIndex = COURSE_ORDER.indexOf(course);
        const previousCourses = COURSE_ORDER.slice(0, courseIndex);
        const missingPrevious = previousCourses.find((c) => !alreadyOrdered.includes(c));
        if (missingPrevious) continue;

        nextCourse = course;
        break;
      }

      setCurrentCourse(nextCourse);

      if (nextCourse) {
        // Load menu for that course
        const menuRes: any = await menuAPI.getAll(nextCourse);
        setMenu(menuRes.grouped || {});
      }

      localStorage.setItem("pau_dinner_name", name);
      localStorage.setItem("pau_dinner_table", String(tableNum));
      setNameEntered(true);
    } catch {
      toast.error("Failed to check your status. Please try again.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSelect = (category: string, itemId: string) => {
    setSelected((prev) => ({ ...prev, [category]: itemId }));
    setSelectedVariants((prev) => { const u = { ...prev }; delete u[itemId]; return u; });
  };

  const handleVariantSelect = (menuItemId: string, variant: string) => {
    setSelectedVariants((prev) => ({ ...prev, [menuItemId]: variant }));
  };

  const handleSubmit = async () => {
    const tableNum = parseInt(tableNumber);
    const selectedItems = Object.values(selected).filter(Boolean);
    if (selectedItems.length === 0) { toast.error("Please select at least one item."); return; }

    const allMenuItems = Object.values(menu).flat() as MenuItem[];
    for (const itemId of selectedItems) {
      const menuItem = allMenuItems.find((m) => m.id === itemId);
      if (menuItem && menuItem.variants && menuItem.variants.length > 0) {
        if (!selectedVariants[itemId]) {
          toast.error(`Please choose an option for "${menuItem.name}".`); return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res: any = await ordersAPI.place({
        studentName: studentName.trim(),
        tableNumber: tableNum,
        items: selectedItems.map((itemId) => ({
          menuItemId: itemId,
          variant: selectedVariants[itemId] || null,
        })),
        specialNotes: specialNotes.trim() || undefined,
      });

      toast.success("Order placed!");
      router.push(
        `/confirmation?orderId=${res.order.id}&name=${encodeURIComponent(res.order.studentName)}&table=${tableNum}&course=${currentCourse}`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to place order.");
      setSubmitting(false);
    }
  };

  const courseInfo = currentCourse ? COURSE_LABELS[currentCourse] : null;

  // What message to show when no course available for this student
  const getStatusMessage = () => {
    if (openCourses.length === 0) return { title: "Ordering is Closed", body: "Please wait for the announcement.", emoji: "⏸" };

    // They've ordered everything that's open
    const allOrderedOrNotOpen = COURSE_ORDER.every((c) => orderedCourses.includes(c) || !openCourses.includes(c));
    if (allOrderedOrNotOpen) {
      const nextUnopenCourse = COURSE_ORDER.find((c) => !orderedCourses.includes(c) && !openCourses.includes(c));
      if (nextUnopenCourse) {
        return {
          title: "You're all caught up!",
          body: `You've ordered everything that's currently open. Come back when the ${COURSE_LABELS[nextUnopenCourse].label} opens!`,
          emoji: "✅"
        };
      }
      return { title: "All done!", body: "You've placed all your orders for tonight. Enjoy the evening!", emoji: "🎉" };
    }

    // They're missing a previous course
    return {
      title: "Previous course required",
      body: `You need to order your Starter before you can access the Main Course or Dessert.`,
      emoji: "⚠️"
    };
  };

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
        {/* Show open courses */}
        {openCourses.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
            {openCourses.map((c) => (
              <div key={c} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "20px", padding: "6px 16px" }}>
                <span style={{ fontSize: "16px" }}>{COURSE_LABELS[c].emoji}</span>
                <span style={{ color: "#e8c97e", fontWeight: 600, fontSize: "0.85rem" }}>{COURSE_LABELS[c].label} open</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 20px" }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "12px" }} />)}
          </div>
        )}

        {/* Ordering closed */}
        {!loading && openCourses.length === 0 && (
          <div className="card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "3rem", marginBottom: "16px" }}>⏸</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#f5f0e8", marginBottom: "12px" }}>Ordering is Closed</h2>
            <p style={{ color: "#9b93b0", lineHeight: 1.7 }}>Please wait for the announcement before placing your order.</p>
            <p style={{ color: "#c9a84c", fontSize: "0.85rem", marginTop: "16px", fontStyle: "italic" }}>Enjoy the evening!</p>
          </div>
        )}

        {/* Step 1: Name + Table entry */}
        {!loading && openCourses.length > 0 && !nameEntered && (
          <div className="card" style={{ padding: "28px", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#e8c97e", marginBottom: "20px" }}>
              Enter your details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label className="label">Your Full Name *</label>
                <input className="input-field" type="text" placeholder="e.g. Adaeze Okonkwo" value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkStudentStatus()} />
              </div>
              <div>
                <label className="label">Table Number *</label>
                <input className="input-field" type="number" min="1" max="24" placeholder="1 – 24" value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkStudentStatus()} />
                <p style={{ fontSize: "0.75rem", color: "#9b93b0", marginTop: "6px" }}>Your table number is on your place card 🪧</p>
              </div>
            </div>
            <button className="btn-gold" onClick={checkStudentStatus} disabled={checkingStatus}
              style={{ width: "100%", padding: "14px", opacity: checkingStatus ? 0.7 : 1 }}>
              {checkingStatus ? "Checking..." : "Continue →"}
            </button>
          </div>
        )}

        {/* Step 2: Show menu or status */}
        {!loading && nameEntered && (
          <>
            {/* Student info strip */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "12px 16px", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "10px" }}>
              <div>
                <p style={{ fontWeight: 500, color: "#f5f0e8", marginBottom: "2px" }}>{studentName}</p>
                <p style={{ fontSize: "0.78rem", color: "#9b93b0" }}>Table {tableNumber}</p>
              </div>
              <button onClick={() => { setNameEntered(false); setCurrentCourse(null); setMenu({}); setSelected({}); setSelectedVariants({}); setOrderedCourses([]); }}
                style={{ background: "none", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", color: "#9b93b0", fontSize: "0.75rem", fontFamily: "var(--font-body)" }}>
                Change
              </button>
            </div>

            {/* Already ordered badges */}
            {orderedCourses.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                {orderedCourses.map((c) => (
                  <span key={c} style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontWeight: 600 }}>
                    ✓ {COURSE_LABELS[c].label} ordered
                  </span>
                ))}
              </div>
            )}

            {/* No available course for this student */}
            {!currentCourse && (() => {
              const msg = getStatusMessage();
              return (
                <div className="card" style={{ padding: "48px", textAlign: "center" }}>
                  <p style={{ fontSize: "3rem", marginBottom: "16px" }}>{msg.emoji}</p>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#f5f0e8", marginBottom: "12px" }}>{msg.title}</h2>
                  <p style={{ color: "#9b93b0", lineHeight: 1.7 }}>{msg.body}</p>
                </div>
              );
            })()}

            {/* Order form for current course */}
            {currentCourse && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "10px 16px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{courseInfo?.emoji}</span>
                  <div>
                    <p style={{ color: "#c9a84c", fontWeight: 600, fontSize: "0.85rem" }}>Now ordering:</p>
                    <p style={{ color: "#f5f0e8", fontWeight: 600 }}>{courseInfo?.label}</p>
                  </div>
                </div>

                {/* Menu items */}
                {Object.keys(menu).length === 0 ? (
                  <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                    <p style={{ color: "#9b93b0" }}>No items available yet.</p>
                  </div>
                ) : (
                  Object.entries(menu).map(([category, items]) => (
                    <div key={category} className="card" style={{ padding: "24px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#e8c97e" }}>{category}</h2>
                        <span style={{ fontSize: "0.7rem", color: "#9b93b0", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "10px" }}>Pick one</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(items as MenuItem[]).map((item) => {
                          const isSelected = selected[category] === item.id;
                          const isUnavailable = !item.isAvailable;
                          const isLow = item.quantity <= 5 && item.quantity > 0;
                          const hasVariants = item.variants && item.variants.length > 0;
                          const chosenVariant = selectedVariants[item.id];

                          return (
                            <div key={item.id}>
                              <button onClick={() => !isUnavailable && handleSelect(category, item.id)} disabled={isUnavailable}
                                style={{
                                  display: "flex", justifyContent: "space-between", alignItems: "center",
                                  padding: "14px 16px", borderRadius: isSelected && hasVariants ? "10px 10px 0 0" : "10px",
                                  border: "none", cursor: isUnavailable ? "not-allowed" : "pointer", width: "100%",
                                  background: isSelected ? "rgba(201,168,76,0.15)" : isUnavailable ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                                  outline: isSelected ? "1.5px solid rgba(201,168,76,0.6)" : "1.5px solid transparent",
                                  transition: "all 0.2s ease", opacity: isUnavailable ? 0.4 : 1, textAlign: "left",
                                }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontWeight: 500, color: isUnavailable ? "#9b93b0" : "#f5f0e8", textDecoration: isUnavailable ? "line-through" : "none", marginBottom: item.description ? "2px" : 0 }}>
                                    {item.name}
                                  </p>
                                  {item.description && <p style={{ fontSize: "0.8rem", color: "#9b93b0" }}>{item.description}</p>}
                                  {hasVariants && !isSelected && (
                                    <p style={{ fontSize: "0.75rem", color: "#c9a84c", marginTop: "2px" }}>Choose: {item.variants!.join(" / ")}</p>
                                  )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "12px" }}>
                                  {isLow && !isUnavailable && (
                                    <span style={{ fontSize: "0.7rem", color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.2)" }}>{item.quantity} left</span>
                                  )}
                                  {isUnavailable && <span style={{ fontSize: "0.7rem", color: "#e05252", background: "rgba(224,82,82,0.1)", padding: "2px 8px", borderRadius: "10px" }}>Sold out</span>}
                                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, border: isSelected ? "none" : "2px solid rgba(201,168,76,0.3)", background: isSelected ? "#c9a84c" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {isSelected && <span style={{ fontSize: "11px", color: "#0d0826", fontWeight: 700 }}>✓</span>}
                                  </div>
                                </div>
                              </button>

                              {/* Variant dropdown */}
                              {isSelected && hasVariants && (
                                <div style={{ background: "rgba(201,168,76,0.06)", border: "1.5px solid rgba(201,168,76,0.6)", borderTop: "1px solid rgba(201,168,76,0.2)", borderRadius: "0 0 10px 10px", padding: "14px 16px" }}>
                                  <label style={{ display: "block", fontSize: "0.75rem", color: "#c9a84c", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "10px" }}>
                                    Choose your option *
                                  </label>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {item.variants!.map((variant) => {
                                      const isChosen = chosenVariant === variant;
                                      return (
                                        <button key={variant} onClick={() => handleVariantSelect(item.id, variant)}
                                          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: "none", cursor: "pointer", background: isChosen ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)", outline: isChosen ? "1.5px solid rgba(201,168,76,0.5)" : "1.5px solid transparent", transition: "all 0.15s ease", textAlign: "left", width: "100%" }}>
                                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, border: isChosen ? "none" : "2px solid rgba(201,168,76,0.4)", background: isChosen ? "#c9a84c" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {isChosen && <span style={{ fontSize: "9px", color: "#0d0826", fontWeight: 700 }}>✓</span>}
                                          </div>
                                          <span style={{ color: isChosen ? "#f5f0e8" : "#9b93b0", fontWeight: isChosen ? 500 : 400, fontSize: "0.9rem" }}>{variant}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
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
          </>
        )}
      </div>
    </main>
  );
}
