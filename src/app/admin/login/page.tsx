"use client";
// src/app/admin/login/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types";

export default function AdminLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res: any = await authAPI.login({ email, password });
      setAuth(res.user as AuthUser, res.token);
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`);
      router.push("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed.");
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 70%)", padding: "20px",
    }}>
      <div style={{ height: "3px", position: "fixed", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      <div className="card animate-in" style={{ maxWidth: "420px", width: "100%", padding: "40px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: "24px",
          }}>🍽️</div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>
            Staff Portal
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#f5f0e8" }}>
            Admin Login
          </h1>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "24px" }}>
          <div>
            <label className="label">PAU Email Address</label>
            <input
              className="input-field"
              type="email"
              placeholder="yourname@pau.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        <button
          className="btn-gold"
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", fontSize: "0.95rem", padding: "14px", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Logging in..." : "Log In →"}
        </button>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <p style={{ fontSize: "0.82rem", color: "#9b93b0" }}>
            Don't have an account?{" "}
            <Link href="/admin/register" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 500 }}>
              Register here
            </Link>
          </p>
        </div>

        <div style={{ marginTop: "16px", padding: "12px", background: "rgba(201,168,76,0.06)", borderRadius: "8px", border: "1px solid rgba(201,168,76,0.15)" }}>
          <p style={{ fontSize: "0.75rem", color: "#9b93b0", textAlign: "center" }}>
            🔒 Only <strong style={{ color: "#c9a84c" }}>@pau.edu.ng</strong> email addresses are permitted
          </p>
        </div>
      </div>
    </main>
  );
}
