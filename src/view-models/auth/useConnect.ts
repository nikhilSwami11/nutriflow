"use client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState, useSyncExternalStore } from "react";
import { assistantOf, type Assistant } from "@/domain/auth";
import { useAuthRepo } from "./AuthDeps";

export type { Assistant };

const noSubscribe = () => () => {};
/** The connector address: the public app URL when set, else this page's origin. Empty on the server. */
const mcpUrl = () => `${(process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "")}/mcp`;

/** "Use with Claude or ChatGPT": the connector link to paste, and whether each assistant is connected yet. */
export function useConnect() {
  const repo = useAuthRepo();
  const url = useSyncExternalStore(noSubscribe, mcpUrl, () => "");
  // Refetches on focus, so coming back from Claude or ChatGPT shows "Connected" without a reload.
  const apps = useQuery({ queryKey: ["connected-apps"], queryFn: () => repo.connectedApps(), retry: false });
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [url]);

  /** When that assistant was allowed in, or null. */
  const connectedSince = (a: Assistant): Date | null => {
    const hit = (apps.data ?? []).find((x) => assistantOf(x.name) === a);
    return hit ? new Date(hit.since) : null;
  };

  return { url, copy, copied, connectedSince };
}
