"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Subscribe to the SSE stream and refetch live data whenever a new name is
 * added anywhere. The browser auto-reconnects on error.
 */
export function useLiveStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { type?: string };
        if (data.type === "new-name") {
          queryClient.invalidateQueries({ queryKey: ["cars"] });
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        }
      } catch {
        // ignore malformed events
      }
    };
    return () => es.close();
  }, [queryClient]);
}
