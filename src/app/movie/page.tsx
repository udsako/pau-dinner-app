"use client";
// src/app/movie/page.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { MovieMenuItem } from "@/types";

const DEPARTMENTS = [
  "Business Administration", "Computer Science", "Economics",
  "Mass Communication", "Law", "Accounting", "Political Science",
  "Psychology", "Information Technology", "Entrepreneurship", "Other",
];

export default function MovieOrderPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<MovieMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("");
  const [department, setDepartment] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/movie/menu")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMenu(data);
        else setMenuError("Failed to load menu.");
      })
      .catch(() => setMenuError("Network error loading menu."))
      .finally(() => setLoading(false));
  }, []);

  const availableItems = menu.filter((i) => i.isAvailable);
  const allConfirmed = availableItems.length > 0 && availableItems.every((i) => confirmedItems.has(i.id));
  const effectiveDept = department === "Other" ? customDept.trim() : department;
  const isFormValid = studentName.trim() && effectiveDept && allConfirmed;

  const toggleConfirm = (id: string) => {
    setConfirmedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!studentName.trim()) return setSubmitError("Please enter your full name.");
    if (!effectiveDept) return setSubmitError("Please select your department.");
    if (!allConfirmed) return setSubmitError("Please confirm all items.");

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/movie/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          department: effectiveDept,
          confirmedItems: Array.from(confirmedItems),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Failed to place order."); return; }

      sessionStorage.setItem("movieConfirmation", JSON.stringify(data));
      router.push("/movie/confirmation");
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: "2px",
    color: "var(--cream)" as const,
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0826" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(13,8,38,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(201,168,76,0.15)",
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#c9a84c", fontWeight: 400 }}>
            🎬 Movie Night
          </h1>
          <p style={{ fontSize: "0.7rem", color: "#9b93b0" }}>PAU Class of 2026</p>
        </div>
        <span style={{ fontSize: "0.7rem", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "4px", padding: "4px 10px" }}>
          Movie Order
        </span>
      </header>

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Step 1 */}
        <section style={{ marginBottom: "0" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", opacity: 0.8, marginBottom: "4px" }}>Step 1</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#f5f0e8", marginBottom: "20px", fontWeight: 400 }}>Your Details</h2>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b93b0", marginBottom: "8px" }}>Full Name</label>
            <input
              type="text" value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Amaka Nwosu"
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b93b0", marginBottom: "8px" }}>Department</label>
            <select
              value={department} onChange={(e) => setDepartment(e.target.value)}
              style={{ ...inputBase, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
            >
              <option value="" disabled>Select your department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d} style={{ background: "#0d0826" }}>{d}</option>)}
            </select>
            {department === "Other" && (
              <input
                type="text" value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="Type your department"
                style={{ ...inputBase, marginTop: "8px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
              />
            )}
          </div>
        </section>

        <div style={{ height: "1px", background: "rgba(201,168,76,0.1)", margin: "28px 0" }} />

        {/* Step 2 */}
        <section>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", opacity: 0.8, marginBottom: "4px" }}>Step 2</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#f5f0e8", marginBottom: "4px", fontWeight: 400 }}>Your Movie Night Pack</h2>
          <p style={{ fontSize: "0.8rem", color: "#9b93b0", marginBottom: "20px" }}>
            These items are included in your pack. Tick each one to confirm you're aware.
          </p>

          {loading ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#9b93b0" }}>Loading...</div>
          ) : menuError ? (
            <p style={{ color: "#e05252", fontSize: "0.85rem" }}>{menuError}</p>
          ) : availableItems.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9b93b0", padding: "24px 0", fontSize: "0.85rem" }}>
              No items have been added yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {availableItems.map((item) => {
                const checked = confirmedItems.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleConfirm(item.id)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "14px",
                      padding: "16px", width: "100%", textAlign: "left",
                      background: checked ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)",
                      border: checked ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "8px", cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      flexShrink: 0, width: "20px", height: "20px", borderRadius: "4px",
                      background: checked ? "#34d399" : "transparent",
                      border: checked ? "none" : "2px solid rgba(201,168,76,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: "1px",
                    }}>
                      {checked && (
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path d="M1 4L4 7L10 1" stroke="#0d0826" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 500, color: checked ? "#34d399" : "#f5f0e8", fontSize: "0.95rem" }}>{item.name}</p>
                      {item.description && <p style={{ fontSize: "0.75rem", color: "#9b93b0", marginTop: "2px" }}>{item.description}</p>}
                      {item.quantityRemaining <= 10 && (
                        <p style={{ fontSize: "0.7rem", color: "#fbbf24", marginTop: "2px" }}>⚠ {item.quantityRemaining} left</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {availableItems.length > 0 && !allConfirmed && (
            <button
              onClick={() => setConfirmedItems(new Set(availableItems.map((i) => i.id)))}
              style={{ marginTop: "10px", fontSize: "0.75rem", color: "#c9a84c", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
            >
              Confirm all
            </button>
          )}
        </section>

        <div style={{ height: "1px", background: "rgba(201,168,76,0.1)", margin: "28px 0" }} />

        {/* Summary */}
        {confirmedItems.size > 0 && (
          <div style={{
            marginBottom: "20px", padding: "16px",
            background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "8px",
          }}>
            <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c9a84c", marginBottom: "8px" }}>Your Pack</p>
            {menu.filter((i) => confirmedItems.has(i.id)).map((i) => (
              <p key={i.id} style={{ fontSize: "0.85rem", color: "#f5f0e8", marginBottom: "2px" }}>✓ {i.name}</p>
            ))}
          </div>
        )}

        {submitError && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.2)", borderRadius: "6px", color: "#fca5a5", fontSize: "0.85rem" }}>
            {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !isFormValid}
          style={{
            width: "100%", padding: "14px",
            background: isFormValid ? "linear-gradient(135deg, #9a7a32, #c9a84c, #e8c97e)" : "rgba(201,168,76,0.15)",
            color: isFormValid ? "#0d0826" : "#9b93b0",
            border: "none", borderRadius: "8px", fontSize: "0.85rem",
            fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: isFormValid ? "pointer" : "not-allowed",
            fontFamily: "var(--font-body)",
          }}
        >
          {submitting ? "Placing Order..." : "Confirm Movie Night Order"}
        </button>

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#9b93b0", marginTop: "12px", opacity: 0.6 }}>
          Orders cannot be changed after submission
        </p>
      </div>
    </div>
  );
}