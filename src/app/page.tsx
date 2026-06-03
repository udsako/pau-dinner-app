"use client";
// src/app/page.tsx

import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 70%)",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top gold bar */}
      <div style={{ height: "3px", position: "fixed", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      {/* Subtle background glow */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.15,
        background: "radial-gradient(ellipse 80% 60% at 50% 20%, #c9a84c33 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "560px", width: "100%" }}>

        {/* Badge */}
        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase",
            color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)",
            background: "rgba(201,168,76,0.07)", borderRadius: "20px",
            padding: "6px 16px",
          }}>
            Pan-Atlantic University · Class of 2026
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.8rem, 10vw, 5rem)",
          fontWeight: 300,
          lineHeight: 1.1,
          marginBottom: "12px",
          color: "#f5f0e8",
        }}>
          Final Year
          <br />
          <span style={{
            background: "linear-gradient(135deg, #c9a84c, #e8c97e, #c9a84c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Events
          </span>
        </h1>

        {/* Divider */}
        <div style={{ width: "48px", height: "1px", background: "linear-gradient(90deg, transparent, #c9a84c, transparent)", margin: "20px auto" }} />

        <p style={{ fontSize: "0.9rem", color: "#9b93b0", marginBottom: "40px", lineHeight: 1.6 }}>
          Select your event and place your order below.
        </p>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>

          {/* Dinner */}
          <Link href="/order" style={{ textDecoration: "none" }}>
            <div
              className="event-card"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "16px",
                padding: "28px 20px",
                textAlign: "left",
                transition: "all 0.25s ease",
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.5)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.2)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", marginBottom: "16px",
              }}>🍽️</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#e8c97e", marginBottom: "6px", fontWeight: 400 }}>
                Dinner
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#9b93b0", lineHeight: 1.5, marginBottom: "16px" }}>
                Seated dining, table-based ordering.
              </p>
              <span style={{ fontSize: "0.7rem", color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Order now →
              </span>
            </div>
          </Link>

          {/* BBQ */}
          <Link href="/bbq" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "16px",
                padding: "28px 20px",
                textAlign: "left",
                transition: "all 0.25s ease",
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.5)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.2)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", marginBottom: "16px",
              }}>🔥</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#e8c97e", marginBottom: "6px", fontWeight: 400 }}>
                BBQ
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#9b93b0", lineHeight: 1.5, marginBottom: "16px" }}>
                Choose your protein, starch & more.
              </p>
              <span style={{ fontSize: "0.7rem", color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Order now →
              </span>
            </div>
          </Link>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#9b93b0", opacity: 0.6 }}>
          Admin?{" "}
          <Link href="/admin/login" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 500 }}>
            Sign in here
          </Link>
        </p>
      </div>

      {/* Bottom label */}
      <div style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)" }}>
        <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9b93b0", opacity: 0.4 }}>
          PAU · 2026
        </p>
      </div>
    </main>
  );
}