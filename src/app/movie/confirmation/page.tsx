"use client";
// src/app/movie/confirmation/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MovieOrderSubmitResponse } from "@/types";

export default function MovieConfirmationPage() {
  const [order, setOrder] = useState<MovieOrderSubmitResponse | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("movieConfirmation");
    if (data) setOrder(JSON.parse(data));
  }, []);

  if (!order) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0826" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#9b93b0" }}>No order found.</p>
          <Link href="/movie" style={{ color: "#c9a84c", display: "block", marginTop: "16px" }}>Place a Movie Night order</Link>
        </div>
      </div>
    );
  }

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 70%)", padding: "24px", position: "relative",
    }}>
      <div style={{ height: "3px", position: "fixed", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      <div style={{ textAlign: "center", maxWidth: "420px", width: "100%", position: "relative", zIndex: 10 }}>
        {/* Icon */}
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%", margin: "0 auto 24px",
          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px",
        }}>🎬</div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "#f5f0e8", marginBottom: "8px", fontWeight: 300 }}>
          Order Confirmed!
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#9b93b0", marginBottom: "32px" }}>
          Your Movie Night pack has been reserved
        </p>

        {/* Details */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "12px", padding: "24px", textAlign: "left", marginBottom: "24px",
        }}>
          {[
            { label: "Name", value: order.studentName },
            { label: "Department", value: order.department },
          ].map(({ label, value }, i) => (
            <div key={label}>
              {i > 0 && <div style={{ height: "1px", background: "rgba(201,168,76,0.1)", margin: "12px 0" }} />}
              <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b93b0", marginBottom: "4px" }}>{label}</p>
              <p style={{ color: "#f5f0e8", fontSize: "0.95rem" }}>{value}</p>
            </div>
          ))}
          <div style={{ height: "1px", background: "rgba(201,168,76,0.1)", margin: "12px 0" }} />
          <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b93b0", marginBottom: "8px" }}>Your Pack Includes</p>
          {order.confirmedItems.map((itemId) => (
            <p key={itemId} style={{ fontSize: "0.85rem", color: "#34d399", marginBottom: "2px" }}>✓ Item confirmed</p>
          ))}
        </div>

        <p style={{ fontSize: "0.8rem", color: "#9b93b0", opacity: 0.7 }}>
          Sit back, relax, and enjoy the movie! 🍿
        </p>
      </div>
    </main>
  );
}