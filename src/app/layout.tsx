// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PAU Final Year Dinner 2026",
  description: "Food ordering system for Pan-Atlantic University's Final Year Dinner",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e1650",
              color: "#f5f0e8",
              border: "1px solid rgba(201, 168, 76, 0.3)",
              fontFamily: "var(--font-body)",
              borderRadius: "10px",
            },
            success: {
              iconTheme: { primary: "#34d399", secondary: "#0d0826" },
            },
            error: {
              iconTheme: { primary: "#e05252", secondary: "#0d0826" },
            },
          }}
        />
      </body>
    </html>
  );
}
