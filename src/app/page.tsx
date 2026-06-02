// src/app/page.tsx
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, #c9a84c22 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }}
      />

      <div className="relative z-10 text-center max-w-3xl fade-up">
        {/* Badge */}
        <div className="inline-block mb-6">
          <span
            className="text-xs font-medium tracking-[0.3em] uppercase px-4 py-2 rounded-full"
            style={{ border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.07)", color: "var(--gold)" }}
          >
            Pan-Atlantic University · Class of 2026
          </span>
        </div>

        <h1
          className="text-6xl md:text-8xl font-light mb-4 leading-none"
          style={{ fontFamily: "var(--font-cormorant)", letterSpacing: "-0.02em" }}
        >
          <span className="gold-shimmer">Final Year</span>
          <br />
          <span style={{ color: "var(--cream)" }}>Events</span>
        </h1>

        <div className="w-16 h-px mx-auto my-6" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

        <p className="text-lg mb-2" style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm)" }}>
          Choose your event below to place your order
        </p>
        <p className="text-sm mb-12" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
          Select your dish and let us take care of the rest.
        </p>

        {/* Event Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Dinner Card */}
          <Link
            href="/order"
            className="group relative flex flex-col items-start p-8 text-left transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "4px",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.07)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.5)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.2)";
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
            >
              <span style={{ fontSize: "20px" }}>🍽️</span>
            </div>
            <h2
              className="text-3xl font-light mb-2"
              style={{ fontFamily: "var(--font-cormorant)", color: "var(--gold)" }}
            >
              Dinner
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Final Year Dinner — seated dining, table-based ordering for 240 students.
            </p>
            <span
              className="text-xs tracking-widest uppercase flex items-center gap-2"
              style={{ color: "var(--gold)" }}
            >
              Order Now <span>→</span>
            </span>
          </Link>

          {/* BBQ Card */}
          <Link
            href="/bbq"
            className="group relative flex flex-col items-start p-8 text-left transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "4px",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.07)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.5)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.2)";
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
            >
              <span style={{ fontSize: "20px" }}>🔥</span>
            </div>
            <h2
              className="text-3xl font-light mb-2"
              style={{ fontFamily: "var(--font-cormorant)", color: "var(--gold)" }}
            >
              BBQ
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              BBQ Night — choose your protein & starch, confirm your included items.
            </p>
            <span
              className="text-xs tracking-widest uppercase flex items-center gap-2"
              style={{ color: "var(--gold)" }}
            >
              Order Now <span>→</span>
            </span>
          </Link>
        </div>

        <p className="mt-8 text-xs" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
          Admin?{" "}
          <Link href="/admin/login" className="underline" style={{ color: "var(--gold)" }}>
            Sign in here
          </Link>
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--text-muted)", opacity: 0.3 }}>
          PAU · 2026
        </p>
      </div>
    </main>
  );
}
