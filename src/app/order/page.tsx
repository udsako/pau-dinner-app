// src/app/order/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/hooks/useMenu";
import type { MenuItem } from "@/types";

const CATEGORIES = ["All", "Main", "Drink", "Dessert", "Side"];

export default function OrderPage() {
  const router = useRouter();
  const { menu, loading, error } = useMenu(15000);
  const [studentName, setStudentName] = useState("");
  const [tableNumber, setTableNumber] = useState<number | "">("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filtered =
    activeCategory === "All"
      ? menu
      : menu.filter((item) => item.category === activeCategory);

  const categories = ["All", ...Array.from(new Set(menu.map((i) => i.category)))];

  const handleSubmit = async () => {
    if (!studentName.trim()) return setSubmitError("Please enter your name.");
    if (!tableNumber || tableNumber < 1 || tableNumber > 24)
      return setSubmitError("Please enter a valid table number (1–24).");
    if (!selectedItem) return setSubmitError("Please select a menu item.");

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          tableNumber: Number(tableNumber),
          menuItemId: selectedItem.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to place order. Please try again.");
        return;
      }

      // Store confirmation data and redirect
      sessionStorage.setItem("orderConfirmation", JSON.stringify(data));
      router.push("/confirmation");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
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
          <h1
            className="text-2xl font-light"
            style={{ fontFamily: "var(--font-cormorant)", color: "var(--gold)" }}
          >
            PAU Dinner 2025
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Select your meal
          </p>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(201,168,76,0.3)" }}>
          <span style={{ color: "var(--gold)", fontSize: "16px" }}>✦</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Student Info */}
        <section className="mb-8 fade-up">
          <h2
            className="text-xl font-light mb-4"
            style={{ fontFamily: "var(--font-cormorant)", color: "var(--cream)" }}
          >
            Your Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-2 tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                Full Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Amaka Nwosu"
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "2px",
                  color: "var(--cream)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
              />
            </div>
            <div>
              <label className="block text-xs mb-2 tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                Table Number (1–24)
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 12"
                min={1}
                max={24}
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "2px",
                  color: "var(--cream)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mb-8" style={{ height: "1px", background: "rgba(201,168,76,0.12)" }} />

        {/* Menu */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-light"
              style={{ fontFamily: "var(--font-cormorant)", color: "var(--cream)" }}
            >
              Choose Your Dish
            </h2>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {menu.filter((i) => i.isAvailable && i.quantityRemaining > 0).length} available
            </span>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-4 py-1.5 text-xs tracking-wider uppercase transition-all"
                style={{
                  borderRadius: "2px",
                  border: activeCategory === cat ? "1px solid var(--gold)" : "1px solid rgba(201,168,76,0.2)",
                  background: activeCategory === cat ? "rgba(201,168,76,0.12)" : "transparent",
                  color: activeCategory === cat ? "var(--gold)" : "var(--text-muted)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu items */}
          {loading ? (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <div
                className="w-6 h-6 border-2 rounded-full mx-auto mb-3 animate-spin"
                style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
              />
              Loading menu...
            </div>
          ) : error ? (
            <p className="text-center py-8 text-red-400">{error}</p>
          ) : (
            <div className="grid gap-3">
              {filtered.map((item) => {
                const isUnavailable = !item.isAvailable || item.quantityRemaining === 0;
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => !isUnavailable && setSelectedItem(item)}
                    disabled={isUnavailable}
                    className="w-full text-left p-4 transition-all relative"
                    style={{
                      background: isSelected
                        ? "rgba(201,168,76,0.1)"
                        : "rgba(255,255,255,0.03)",
                      border: isSelected
                        ? "1px solid rgba(201,168,76,0.5)"
                        : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "2px",
                      opacity: isUnavailable ? 0.45 : 1,
                      cursor: isUnavailable ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSelected && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-0.5"
                        style={{ background: "var(--gold)", borderRadius: "2px 0 0 2px" }}
                      />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-medium"
                            style={{ color: isSelected ? "var(--gold)" : "var(--cream)", fontSize: "15px" }}
                          >
                            {item.name}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: "2px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isUnavailable ? (
                          <span className="text-xs text-red-400 font-medium">Sold Out</span>
                        ) : (
                          <span
                            className={`text-xs font-medium ${item.quantityRemaining <= 5 ? "text-amber-400" : ""}`}
                            style={{ color: item.quantityRemaining <= 5 ? "#fbbf24" : "var(--text-muted)" }}
                          >
                            {item.quantityRemaining <= 5
                              ? `⚠ ${item.quantityRemaining} left`
                              : `${item.quantityRemaining} left`}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Submit */}
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

        {selectedItem && (
          <div
            className="mb-4 p-4"
            style={{
              background: "rgba(201,168,76,0.07)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "2px",
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
              Selected
            </p>
            <p className="font-medium" style={{ color: "var(--gold)", fontFamily: "var(--font-cormorant)", fontSize: "18px" }}>
              {selectedItem.name}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedItem || !studentName || !tableNumber}
          className="w-full py-4 font-medium tracking-widest uppercase text-sm transition-all"
          style={{
            background:
              !selectedItem || !studentName || !tableNumber
                ? "rgba(201,168,76,0.2)"
                : "linear-gradient(135deg, var(--gold-dark), var(--gold), var(--gold-light))",
            color: !selectedItem || !studentName || !tableNumber ? "var(--text-muted)" : "var(--charcoal)",
            borderRadius: "2px",
            cursor: !selectedItem || !studentName || !tableNumber ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Placing Order..." : "Confirm Order"}
        </button>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
          Orders cannot be changed after submission
        </p>
      </div>
    </div>
  );
}
