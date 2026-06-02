// src/hooks/useMenu.ts

import { useState, useEffect, useCallback } from "react";
import type { MenuItem } from "@/types";

export function useMenu(pollInterval = 10000) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to fetch menu");
      const data = await res.json();
      setMenu(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
    const interval = setInterval(fetchMenu, pollInterval);
    return () => clearInterval(interval);
  }, [fetchMenu, pollInterval]);

  return { menu, loading, error, refetch: fetchMenu };
}
