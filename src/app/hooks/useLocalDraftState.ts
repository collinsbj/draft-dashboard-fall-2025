"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_AVAILABLE = (() => {
  try {
    const key = "__ls_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
})();

function readStorage<T extends Record<string, unknown>>(
  storageKey: string,
  defaults: T,
): Record<number, T> {
  if (!STORAGE_AVAILABLE) return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return {};

    const result: Record<number, T> = {};
    for (const [idStr, value] of Object.entries(parsed)) {
      const id = Number(idStr);
      if (!Number.isFinite(id)) continue;
      if (typeof value !== "object" || value === null) continue;
      result[id] = { ...defaults, ...(value as Partial<T>) };
    }
    return result;
  } catch {
    return {};
  }
}

const SYNC_EVENT = "local-draft-state-change";

function writeStorage(storageKey: string, data: Record<number, unknown>): void {
  if (!STORAGE_AVAILABLE) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENT, { detail: { key: storageKey } }),
    );
  } catch {
    // Quota exceeded — silently ignore; in-memory state still works
  }
}

function pruneAndDefault<T extends Record<string, unknown>>(
  stateMap: Record<number, T>,
  dbIds: Set<number>,
  defaults: T,
): Record<number, T> {
  const result: Record<number, T> = {};
  for (const id of dbIds) {
    result[id] = stateMap[id] ?? { ...defaults };
  }
  return result;
}

export function useLocalDraftState<T extends Record<string, unknown>>(
  storageKey: string,
  dbIds: number[],
  defaults: T,
): {
  getState: (id: number) => T;
  setState: (id: number, partial: Partial<T>) => void;
  stateMap: Record<number, T>;
} {
  const dbIdSet = useRef(new Set(dbIds));
  dbIdSet.current = new Set(dbIds);

  const [stateMap, setStateMap] = useState<Record<number, T>>(() => {
    if (typeof window === "undefined") return {};
    const stored = readStorage<T>(storageKey, defaults);
    if (dbIds.length === 0) return stored;
    return pruneAndDefault(stored, new Set(dbIds), defaults);
  });

  // Re-prune when dbIds change (e.g. after upload adds/removes players)
  useEffect(() => {
    if (dbIds.length === 0) return;
    setStateMap((prev) => pruneAndDefault(prev, dbIdSet.current, defaults));
  }, [dbIds, defaults]);

  useEffect(() => {
    if (!STORAGE_AVAILABLE) return;
    const reload = () => {
      const stored = readStorage<T>(storageKey, defaults);
      setStateMap(pruneAndDefault(stored, dbIdSet.current, defaults));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) reload();
    };
    const onSync = (event: Event) => {
      if ((event as CustomEvent).detail?.key === storageKey) reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(SYNC_EVENT, onSync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SYNC_EVENT, onSync);
    };
  }, [storageKey, defaults]);

  const getState = useCallback(
    (id: number): T => stateMap[id] ?? { ...defaults },
    [stateMap, defaults],
  );

  const setState = useCallback(
    (id: number, partial: Partial<T>) => {
      setStateMap((prev) => {
        const next = {
          ...prev,
          [id]: { ...(prev[id] ?? defaults), ...partial },
        };
        writeStorage(storageKey, next);
        return next;
      });
    },
    [storageKey, defaults],
  );

  return { getState, setState, stateMap };
}
