// src/app/page.tsx
// Student landing page — shown when no table is specified
"use client";
export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 60%)",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      {/* Decorative top border */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)",
        }}
      />

      {/* Logo / Crest area */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "2px solid rgba(201,168,76,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            background: "rgba(201,168,76,0.08)",
            fontSize: "36px",
          }}
        >
          🍽️
        </div>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#c9a84c",
            marginBottom: "12px",
          }}
        >
          Pan-Atlantic University
        </p>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
            fontWeight: 600,
            color: "#f5f0e8",
            lineHeight: 1.1,
            marginBottom: "8px",
          }}
        >
          Final Year Dinner
        </h1>

        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1rem, 3vw, 1.4rem)",
            fontStyle: "italic",
            color: "#c9a84c",
          }}
        >
          Class of 2026
        </p>
      </div>

      {/* Divider */}
      <div className="ornament" style={{ width: "200px", marginBottom: "32px" }}>✦</div>

      {/* Info card */}
      <div
        className="card"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "32px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            color: "#9b93b0",
            lineHeight: 1.7,
            marginBottom: "24px",
          }}
        >
          To place your food order, please scan the{" "}
          <strong style={{ color: "#f5f0e8" }}>QR code on your table</strong>.
          Each table has a unique code that will take you directly to the ordering page.
        </p>

        <div
          style={{
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "20px", flexShrink: 0 }}>📌</span>
          <p style={{ fontSize: "0.875rem", color: "#9b93b0", lineHeight: 1.6 }}>
            Food is served on a <strong style={{ color: "#c9a84c" }}>first-come, first-served</strong> basis.
            Once a dish runs out, it will be marked as unavailable.
          </p>
        </div>
      </div>

      {/* Admin link */}
      <a
        href="/admin/login"
        style={{
          color: "#9b93b0",
          fontSize: "0.8rem",
          textDecoration: "none",
          letterSpacing: "0.05em",
          transition: "color 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.color = "#c9a84c")}
        onMouseOut={(e) => (e.currentTarget.style.color = "#9b93b0")}
      >
        Staff / Admin Login →
      </a>

      {/* Bottom border */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)",
        }}
      />
    </main>
  );
}
