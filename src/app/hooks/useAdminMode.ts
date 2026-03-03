"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dglffl:admin-mode";
const QUERY_PARAM = "admin";

export function useAdminMode(): { isAdmin: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        setIsAdmin(true);
        return;
      }
    } catch {
      // localStorage unavailable
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get(QUERY_PARAM) === "true") {
      setIsAdmin(true);
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // localStorage unavailable — admin mode active for session only
      }
      params.delete(QUERY_PARAM);
      const qs = params.toString();
      const newUrl =
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  return { isAdmin };
}
