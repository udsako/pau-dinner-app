"use client";
// src/app/bbq/page.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { BbqMenuItem } from "@/types";

const DEPARTMENTS = [
  "Business Administration",
  "Computer Science",
  "Economics",
  "Mass Communication",
  "ISMS",
  "Accounting",
  "Strategic Communication",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Finance",
];

export default function BbqOrderPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<BbqMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("");
  const [department, setDepartment] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [proteinChoiceId, setProteinChoiceId] = useState<string | null>(null);
  const [starchChoiceId, setStarchChoiceId] = useState<string | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    const MAX = 3;

    const tryFetch = () => {
      attempts++;
      fetch("/api/bbq/menu")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setMenu(data);
            setMenuError(null);
            setLoading(false);
          } else {
            throw new Error("Invalid response");
          }
        })
        .catch(() => {
          if (attempts < MAX) {
            setTimeout(tryFetch, 1500);
          } else {
            setMenuError("Failed to load menu. Please refresh the page.");
            setLoading(false);
          }
        });
    };

    tryFetch();
  }, []);

  const compulsoryItems = menu.filter((i) => i.category === "COMPULSORY" && i.isAvailable);
  const proteinOptions = menu.filter((i) => i.category === "PROTEIN");
  const starchOptions = menu.filter((i) => i.category === "STARCH");

  const allCompulsoryConfirmed =
    compulsoryItems.length > 0 &&
    compulsoryItems.every((item) => confirmedItems.has(item.id));

  const effectiveDept = department === "Other" ? customDept.trim() : department;

  const isFormValid =
    studentName.trim() &&
    effectiveDept &&
    proteinChoiceId &&
    starchChoiceId &&
    allCompulsoryConfirmed;

  const toggleConfirm = (id: string) => {
    setConfirmedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (!studentName.trim()) return setSubmitError("Please enter your full name.");
      if (!effectiveDept) return setSubmitError("Please select or enter your department.");
      if (!allCompulsoryConfirmed) return setSubmitError("Please confirm all compulsory items.");
      if (!proteinChoiceId) return setSubmitError("Please select a protein choice.");
      if (!starchChoiceId) return setSubmitError("Please select a starch choice.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/bbq/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          department: effectiveDept,
          proteinChoiceId,
          starchChoiceId,
          confirmedItems: Array.from(confirmedItems),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to place order. Please try again.");
        return;
      }

      sessionStorage.setItem("bbqConfirmation", JSON.stringify(data));
      router.push("/bbq/confirmation");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sectionTitle = {
    fontFamily: "var(--font-cormorant)",
    color: "var(--cream)",
    fontSize: "22px",
    fontWeight: 300,
  };

  const inputBase = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: "2px",
    color: "var(--cream)",
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const divider = {
    height: "1px",
    background: "rgba(201,168,76,0.1)",
    margin: "28px 0",
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
        <div>
          <h1 className="text-2xl font-light" style={{ fontFamily: "var(--font-cormorant)", color: "var(--gold)" }}>
            🔥 BBQ Night
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>PAU Class of 2026</p>
        </div>
        <span
          className="text-xs px-3 py-1"
          style={{ border: "1px solid rgba(201,168,76,0.25)", borderRadius: "2px", color: "var(--gold)", opacity: 0.8 }}
        >
          BBQ Order
        </span>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">

        {/* ── SECTION 1: Your Details ─────────────────────────────────────── */}
        <section className="mb-0 fade-up">
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "var(--gold)", opacity: 0.7 }}>
            Step 1
          </p>
          <h2 style={sectionTitle} className="mb-5">Your Details</h2>

          <div className="mb-4">
            <label className="block text-xs mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Amaka Nwosu"
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
            />
          </div>

          <div>
            <label className="block text-xs mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{ ...inputBase, appearance: "none" as never, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
            >
              <option value="" disabled>Select your department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} style={{ background: "#1a1510" }}>{d}</option>
              ))}
            </select>

            {department === "Other" && (
              <input
                type="text"
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="Type your department"
                style={{ ...inputBase, marginTop: "8px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
              />
            )}
          </div>
        </section>

        <div style={divider} />

        {/* ── SECTION 2: Compulsory Items ─────────────────────────────────── */}
        <section>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "var(--gold)", opacity: 0.7 }}>
            Step 2
          </p>
          <h2 style={sectionTitle} className="mb-1">Compulsory Items</h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
            These are included in your BBQ plate. Tick each one to confirm you&apos;re aware.
          </p>

          {loading ? (
            <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
              <div className="w-5 h-5 border-2 rounded-full mx-auto mb-2 animate-spin" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
              Loading menu...
            </div>
          ) : menuError ? (
            <div>
              <p className="text-sm mb-3" style={{ color: "#fca5a5" }}>{menuError}</p>
              <button
                onClick={() => { setMenuError(null); setLoading(true); window.location.reload(); }}
                className="text-xs underline"
                style={{ color: "var(--gold)" }}
              >
                Tap to retry
              </button>
            </div>
          ) : compulsoryItems.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              No compulsory items have been added yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {compulsoryItems.map((item) => {
                const checked = confirmedItems.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleConfirm(item.id)}
                    className="w-full text-left flex items-start gap-4 p-4 transition-all"
                    style={{
                      background: checked ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)",
                      border: checked ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "2px",
                    }}
                  >
                    <div
                      className="flex-shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all"
                      style={{
                        background: checked ? "#34d399" : "transparent",
                        border: checked ? "none" : "2px solid rgba(201,168,76,0.4)",
                      }}
                    >
                      {checked && (
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path d="M1 4L4 7L10 1" stroke="#1a1510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: checked ? "#34d399" : "var(--cream)" }}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {compulsoryItems.length > 0 && !allCompulsoryConfirmed && (
            <button
              onClick={() => setConfirmedItems(new Set(compulsoryItems.map((i) => i.id)))}
              className="mt-3 text-xs underline"
              style={{ color: "var(--gold)", opacity: 0.7 }}
            >
              Confirm all
            </button>
          )}
        </section>

        <div style={divider} />

        {/* ── SECTION 3: Choose Protein ───────────────────────────────────── */}
        <section>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "var(--gold)", opacity: 0.7 }}>
            Step 3
          </p>
          <h2 style={sectionTitle} className="mb-1">Choose Your Protein</h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
            Pick <strong style={{ color: "var(--cream)" }}>one</strong> option below.
          </p>

          {loading ? (
            <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
              <div className="w-5 h-5 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
            </div>
          ) : proteinOptions.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              No protein options available yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {proteinOptions.map((item) => {
                const selected = proteinChoiceId === item.id;
                const soldOut = !item.isAvailable || item.quantityRemaining <= 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => !soldOut && setProteinChoiceId(item.id)}
                    disabled={soldOut}
                    className="flex flex-col items-center justify-center p-6 transition-all"
                    style={{
                      background: selected ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
                      border: selected ? "1px solid rgba(201,168,76,0.6)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "4px",
                      opacity: soldOut ? 0.4 : 1,
                      cursor: soldOut ? "not-allowed" : "pointer",
                      position: "relative",
                    }}
                  >
                    {selected && (
                      <div
                        className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "var(--gold)" }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="#1a1510" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    <span style={{ fontSize: "28px", marginBottom: "8px" }}>
                      {item.name.toLowerCase().includes("turkey") ? "🦃" : "🐟"}
                    </span>
                    <span className="font-medium text-sm" style={{ color: selected ? "var(--gold)" : "var(--cream)" }}>
                      {item.name}
                    </span>
                    {soldOut ? (
                      <span className="text-xs mt-1 text-red-400">Sold Out</span>
                    ) : (
                      <span className="text-xs mt-1" style={{ color: item.quantityRemaining <= 10 ? "#fbbf24" : "var(--text-muted)" }}>
                        {item.quantityRemaining <= 10 ? `⚠ ${item.quantityRemaining} left` : `${item.quantityRemaining} left`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div style={divider} />

        {/* ── SECTION 4: Choose Starch ────────────────────────────────────── */}
        <section>
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "var(--gold)", opacity: 0.7 }}>
            Step 4
          </p>
          <h2 style={sectionTitle} className="mb-1">Choose Your Starch</h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
            Pick <strong style={{ color: "var(--cream)" }}>one</strong> option below.
          </p>

          {loading ? (
            <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
              <div className="w-5 h-5 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
            </div>
          ) : starchOptions.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              No starch options available yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {starchOptions.map((item) => {
                const selected = starchChoiceId === item.id;
                const soldOut = !item.isAvailable || item.quantityRemaining <= 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => !soldOut && setStarchChoiceId(item.id)}
                    disabled={soldOut}
                    className="flex flex-col items-center justify-center p-6 transition-all"
                    style={{
                      background: selected ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
                      border: selected ? "1px solid rgba(201,168,76,0.6)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "4px",
                      opacity: soldOut ? 0.4 : 1,
                      cursor: soldOut ? "not-allowed" : "pointer",
                      position: "relative",
                    }}
                  >
                    {selected && (
                      <div
                        className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "var(--gold)" }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="#1a1510" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    <span style={{ fontSize: "28px", marginBottom: "8px" }}>
                      {item.name.toLowerCase().includes("yam") ? "🍠" : "🍌"}
                    </span>
                    <span className="font-medium text-sm" style={{ color: selected ? "var(--gold)" : "var(--cream)" }}>
                      {item.name}
                    </span>
                    {soldOut ? (
                      <span className="text-xs mt-1 text-red-400">Sold Out</span>
                    ) : (
                      <span className="text-xs mt-1" style={{ color: item.quantityRemaining <= 10 ? "#fbbf24" : "var(--text-muted)" }}>
                        {item.quantityRemaining <= 10 ? `⚠ ${item.quantityRemaining} left` : `${item.quantityRemaining} left`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div style={divider} />

        {/* ── Order Summary Preview ────────────────────────────────────────── */}
        {(proteinChoiceId || starchChoiceId || confirmedItems.size > 0) && (
          <div
            className="mb-6 p-5"
            style={{
              background: "rgba(201,168,76,0.05)",
              border: "1px solid rgba(201,168,76,0.18)",
              borderRadius: "4px",
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
              Your Order Summary
            </p>
            <div className="grid gap-2 text-sm">
              {confirmedItems.size > 0 && (
                <div className="flex gap-2">
                  <span style={{ color: "var(--text-muted)", minWidth: "80px" }}>Included:</span>
                  <span style={{ color: "var(--cream)" }}>
                    {compulsoryItems.filter((i) => confirmedItems.has(i.id)).map((i) => i.name).join(", ")}
                  </span>
                </div>
              )}
              {proteinChoiceId && (
                <div className="flex gap-2">
                  <span style={{ color: "var(--text-muted)", minWidth: "80px" }}>Protein:</span>
                  <span style={{ color: "var(--cream)" }}>
                    {menu.find((i) => i.id === proteinChoiceId)?.name}
                  </span>
                </div>
              )}
              {starchChoiceId && (
                <div className="flex gap-2">
                  <span style={{ color: "var(--text-muted)", minWidth: "80px" }}>Starch:</span>
                  <span style={{ color: "var(--cream)" }}>
                    {menu.find((i) => i.id === starchChoiceId)?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {submitError && (
          <p
            className="mb-4 text-sm px-4 py-3"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "2px",
              color: "#fca5a5",
            }}
          >
            {submitError}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !isFormValid}
          className="w-full py-4 font-medium tracking-widest uppercase text-sm transition-all mb-4"
          style={{
            background: isFormValid
              ? "linear-gradient(135deg, var(--gold-dark), var(--gold), var(--gold-light))"
              : "rgba(201,168,76,0.15)",
            color: isFormValid ? "var(--charcoal)" : "var(--text-muted)",
            borderRadius: "2px",
            cursor: isFormValid ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "Placing Order..." : "Confirm BBQ Order"}
        </button>

        <p className="text-center text-xs" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
          Orders cannot be changed after submission
        </p>
      </div>
    </div>
  );
}