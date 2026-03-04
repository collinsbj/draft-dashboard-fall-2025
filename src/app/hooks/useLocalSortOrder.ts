"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function isStorageAvailable(): boolean {
  try {
    const key = "__ls_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function readOrderFromStorage(storageKey: string): number[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (v: unknown) => typeof v === "number" && Number.isFinite(v),
    );
  } catch {
    return null;
  }
}

function writeOrderToStorage(storageKey: string, ids: number[]): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // Quota exceeded — silently ignore
  }
}

/**
 * Reconcile a stored order with the current set of DB IDs:
 * - Keep stored IDs that still exist in DB (preserving order)
 * - Append new DB IDs not in stored order to the end
 * - Drop stored IDs that no longer exist in DB
 */
function reconcile(stored: number[] | null, dbIds: number[]): number[] {
  if (!stored) return dbIds;
  const dbSet = new Set(dbIds);
  const ordered = stored.filter((id) => dbSet.has(id));
  const seen = new Set(ordered);
  for (const id of dbIds) {
    if (!seen.has(id)) ordered.push(id);
  }
  return ordered;
}

export function useLocalSortOrder(
  storageKey: string,
  dbIds: number[],
): {
  orderedIds: number[];
  reorder: (updates: Array<{ id: number; sortOrder: number }>) => void;
} {
  const canStore = typeof window !== "undefined" && isStorageAvailable();
  const dbIdsRef = useRef(dbIds);
  dbIdsRef.current = dbIds;

  const [orderedIds, setOrderedIds] = useState<number[]>(() => {
    if (typeof window === "undefined") return dbIds;
    const stored = readOrderFromStorage(storageKey);
    if (dbIds.length === 0) return stored ?? [];
    return reconcile(stored, dbIds);
  });

  // Re-reconcile when dbIds change (new players added/removed)
  useEffect(() => {
    if (dbIds.length === 0) return;
    setOrderedIds((prev) => {
      const next = reconcile(prev, dbIds);
      if (canStore) writeOrderToStorage(storageKey, next);
      return next;
    });
  }, [dbIds, storageKey, canStore]);

  // Cross-tab sync
  useEffect(() => {
    if (!canStore) return;
    const handler = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const stored = readOrderFromStorage(storageKey);
      setOrderedIds(reconcile(stored, dbIdsRef.current));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey, canStore]);

  const reorder = useCallback(
    (updates: Array<{ id: number; sortOrder: number }>) => {
      setOrderedIds((prev) => {
        const sorted = [...updates].sort((a, b) => a.sortOrder - b.sortOrder);
        const reorderedIds = sorted.map((u) => u.id);
        // IDs not in the updates keep their existing relative positions at the end
        const updateSet = new Set(reorderedIds);
        const rest = prev.filter((id) => !updateSet.has(id));
        const next = [...reorderedIds, ...rest];
        if (canStore) writeOrderToStorage(storageKey, next);
        return next;
      });
    },
    [storageKey, canStore],
  );

  return { orderedIds, reorder };
}
