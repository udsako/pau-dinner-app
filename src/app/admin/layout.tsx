"use client";
// src/app/admin/layout.tsx

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types";

const ADMIN_NAV = [
  { href: "/admin/dashboard", icon: "⬡", label: "Dashboard" },
  { href: "/admin/tables", icon: "◈", label: "Tables" },
  { href: "/admin/waiter", icon: "🍽️", label: "Waiter View" },
  { href: "/admin/menu", icon: "✦", label: "Menu & Courses" },
  { href: "/admin/notifications", icon: "◉", label: "Alerts" },
];

const WAITER_NAV = [
  { href: "/admin/waiter", icon: "🍽️", label: "My Orders" },
];

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/register"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("pau_dinner_token");
    const savedUser = localStorage.getItem("pau_dinner_user");
    if (savedToken && savedUser) {
      setAuth(JSON.parse(savedUser) as AuthUser, savedToken);
    }
    setMounted(true);
  }, []);

  const isPublicPath = PUBLIC_ADMIN_PATHS.includes(pathname);

  useEffect(() => {
    if (mounted && !isPublicPath && !token) {
      router.push("/admin/login");
    }
    if (mounted && token && user?.role === "WAITER" && !isPublicPath) {
      const waiterAllowed = ["/admin/waiter"];
      const isAllowed = waiterAllowed.some((p) => pathname.startsWith(p));
      if (!isAllowed) router.push("/admin/waiter");
    }
  }, [mounted, token, isPublicPath, pathname, user]);

  if (isPublicPath) return <>{children}</>;
  if (!mounted || !token) return null;

  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV : WAITER_NAV;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0826" }}>
      <aside style={{
        width: "220px", flexShrink: 0,
        background: "linear-gradient(180deg, #160f3a 0%, #0d0826 100%)",
        borderRight: "1px solid rgba(201,168,76,0.12)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40,
      }}>
        <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
          <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "4px" }}>
            PAU Dinner
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "#f5f0e8", lineHeight: 1.2 }}>
            {isAdmin ? "Admin Panel" : "Waiter Panel"}
          </h2>
          <div style={{
            display: "inline-flex", marginTop: "8px",
            background: isAdmin ? "rgba(201,168,76,0.12)" : "rgba(52,211,153,0.12)",
            border: `1px solid ${isAdmin ? "rgba(201,168,76,0.3)" : "rgba(52,211,153,0.3)"}`,
            borderRadius: "20px", padding: "3px 10px",
          }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", color: isAdmin ? "#c9a84c" : "#34d399" }}>
              {isAdmin ? "● ADMIN" : "● WAITER"}
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "8px", marginBottom: "4px",
                textDecoration: "none", transition: "all 0.2s ease",
                background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
                color: isActive ? "#e8c97e" : "#9b93b0",
                fontWeight: isActive ? 500 : 400, fontSize: "0.9rem",
                border: isActive ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
              }}>
                <span style={{ fontSize: "14px", opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
          <div style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "0.82rem", color: "#f5f0e8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#9b93b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </p>
          </div>
          <button className="btn-ghost"
            onClick={() => { clearAuth(); router.push("/admin/login"); }}
            style={{ width: "100%", fontSize: "0.8rem", padding: "8px" }}>
            Log Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: "220px", minHeight: "100vh", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
