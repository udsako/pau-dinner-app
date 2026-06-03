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
      padding: "24px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ height: "3px", position: "fixed", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      <div style={{
        position: "absolute", inset: 0, opacity: 0.15,
        background: "radial-gradient(ellipse 80% 60% at 50% 20%, #c9a84c33 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "680px", width: "100%" }}>

        {/* Badge */}
        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase",
            color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)",
            background: "rgba(201,168,76,0.07)", borderRadius: "20px", padding: "6px 16px",
          }}>
            Pan-Atlantic University · Class of 2026
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.2rem, 8vw, 4.5rem)",
          fontWeight: 300, lineHeight: 1.1, marginBottom: "12px", color: "#f5f0e8",
        }}>
          Final Year
          <br />
          <span style={{
            background: "linear-gradient(135deg, #c9a84c, #e8c97e, #c9a84c)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Events
          </span>
        </h1>

        {/* Divider */}
        <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, transparent, #c9a84c, transparent)", margin: "16px auto" }} />

        <p style={{ fontSize: "0.85rem", color: "#9b93b0", marginBottom: "32px", lineHeight: 1.6 }}>
          Select your event and place your order.
        </p>

        {/* Cards — stacks to 1 col on mobile, 3 on desktop */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "28px",
        }}>

          {/* Dinner */}
          <Link href="/order" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "14px", padding: "22px 18px",
                textAlign: "left", transition: "all 0.25s ease",
                cursor: "pointer", height: "100%",
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
                width: "40px", height: "40px", borderRadius: "10px",
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", marginBottom: "14px",
              }}>🍽️</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#e8c97e", marginBottom: "5px", fontWeight: 400 }}>
                Dinner
              </h2>
              <p style={{ fontSize: "0.72rem", color: "#9b93b0", lineHeight: 1.5, marginBottom: "14px" }}>
                Seated dining, table-based ordering.
              </p>
              <span style={{ fontSize: "0.65rem", color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
                borderRadius: "14px", padding: "22px 18px",
                textAlign: "left", transition: "all 0.25s ease",
                cursor: "pointer", height: "100%",
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
                width: "40px", height: "40px", borderRadius: "10px",
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", marginBottom: "14px",
              }}>🔥</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#e8c97e", marginBottom: "5px", fontWeight: 400 }}>
                BBQ
              </h2>
              <p style={{ fontSize: "0.72rem", color: "#9b93b0", lineHeight: 1.5, marginBottom: "14px" }}>
                Choose your protein, starch & more.
              </p>
              <span style={{ fontSize: "0.65rem", color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Order now →
              </span>
            </div>
          </Link>

          {/* Movie Night */}
          <Link href="/movie" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: "14px", padding: "22px 18px",
                textAlign: "left", transition: "all 0.25s ease",
                cursor: "pointer", height: "100%",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.5)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.2)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", marginBottom: "14px",
              }}>🎬</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#c4b5fd", marginBottom: "5px", fontWeight: 400 }}>
                Movie Night
              </h2>
              <p style={{ fontSize: "0.72rem", color: "#9b93b0", lineHeight: 1.5, marginBottom: "14px" }}>
                Claim your popcorn & drink pack.
              </p>
              <span style={{ fontSize: "0.65rem", color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Order now →
              </span>
            </div>
          </Link>

        </div>

        <p style={{ fontSize: "0.72rem", color: "#9b93b0", opacity: 0.6 }}>
          Admin?{" "}
          <Link href="/admin/login" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 500 }}>
            Sign in here
          </Link>
        </p>
      </div>

      <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)" }}>
        <p style={{ fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9b93b0", opacity: 0.3 }}>
          PAU · 2026
        </p>
      </div>
    </main>
  );
}