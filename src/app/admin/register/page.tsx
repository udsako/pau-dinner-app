"use client";
// src/app/admin/register/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types";

export default function AdminRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "WAITER" });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res: any = await authAPI.register({ name: form.name, email: form.email, password: form.password, role: form.role });
      setAuth(res.user as AuthUser, res.token);
      toast.success("Account created! Welcome.");
      router.push("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 70%)", padding: "20px",
    }}>
      <div style={{ height: "3px", position: "fixed", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      <div className="card animate-in" style={{ maxWidth: "440px", width: "100%", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "6px" }}>
            Staff Portal
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#f5f0e8" }}>
            Create Account
          </h1>
          <p style={{ color: "#9b93b0", fontSize: "0.85rem", marginTop: "8px" }}>
            Must use your <strong style={{ color: "#c9a84c" }}>@pau.edu.ng</strong> email
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" type="text" placeholder="Jane Doe" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
          </div>
          <div>
            <label className="label">PAU Email</label>
            <input className="input-field" type="email" placeholder="janedoe@pau.edu.ng" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input-field"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="WAITER">Waiter</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input-field" type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => handleChange("password", e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input className="input-field" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
          </div>
        </div>

        <button className="btn-gold" onClick={handleRegister} disabled={loading} style={{ width: "100%", fontSize: "0.95rem", padding: "14px", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Creating account..." : "Create Account →"}
        </button>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ fontSize: "0.82rem", color: "#9b93b0" }}>
            Already have an account?{" "}
            <Link href="/admin/login" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 500 }}>Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
