// src/app/bbq/confirmation/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BbqOrderSubmitResponse } from "@/types";

export default function BbqConfirmationPage() {
  const [order, setOrder] = useState<BbqOrderSubmitResponse | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("bbqConfirmation");
    if (data) setOrder(JSON.parse(data));
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: "var(--text-muted)" }}>No order found.</p>
          <Link href="/bbq" className="block mt-4 underline" style={{ color: "var(--gold)" }}>
            Place a BBQ order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 50%, #fbbf2422 0%, transparent 70%)" }}
      />

      <div className="relative z-10 text-center max-w-md w-full fade-up">
        {/* Fire icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <span style={{ fontSize: "28px" }}>🔥</span>
        </div>

        <h1
          className="text-4xl font-light mb-2"
          style={{ fontFamily: "var(--font-cormorant)", color: "var(--cream)" }}
        >
          BBQ Order Confirmed!
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Your BBQ plate has been reserved
        </p>

        {/* Details card */}
        <div
          className="text-left p-6 mb-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: "4px",
          }}
        >
          <div className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Name</p>
              <p style={{ color: "var(--cream)" }}>{order.studentName}</p>
            </div>
            <div className="h-px" style={{ background: "rgba(201,168,76,0.1)" }} />
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Department</p>
              <p style={{ color: "var(--cream)" }}>{order.department}</p>
            </div>
            <div className="h-px" style={{ background: "rgba(201,168,76,0.1)" }} />
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Protein Choice</p>
              <p className="text-xl font-light" style={{ color: "var(--gold)", fontFamily: "var(--font-cormorant)" }}>
                {order.protein}
              </p>
            </div>
            <div className="h-px" style={{ background: "rgba(201,168,76,0.1)" }} />
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Starch Choice</p>
              <p className="text-xl font-light" style={{ color: "var(--gold)", fontFamily: "var(--font-cormorant)" }}>
                {order.starch}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
          Enjoy the night — your BBQ plate is all set! 🎉
        </p>
      </div>
    </main>
  );
}
