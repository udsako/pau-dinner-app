// src/hooks/useTables.ts

import { useState, useEffect, useCallback } from "react";
import type { DinnerTable } from "@/types";

export function useTables(pollInterval = 8000) {
  const [tables, setTables] = useState<DinnerTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("/api/tables");
      if (!res.ok) throw new Error("Failed to fetch tables");
      const data = await res.json();
      setTables(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Also trigger residual timer processing on each poll
  const checkResiduals = useCallback(async () => {
    try {
      await fetch("/api/tables/residual-check", { method: "POST" });
    } catch {
      // Silently ignore
    }
  }, []);

  useEffect(() => {
    fetchTables();
    checkResiduals();
    const interval = setInterval(async () => {
      await checkResiduals();
      await fetchTables();
    }, pollInterval);
    return () => clearInterval(interval);
  }, [fetchTables, checkResiduals, pollInterval]);

  return { tables, loading, error, refetch: fetchTables };
}
