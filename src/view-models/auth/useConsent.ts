"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuthRepo } from "./AuthDeps";

export type ConsentState =
  | { kind: "loading" }
  | { kind: "ask"; appName: string }
  | { kind: "error"; message: string }
  /** The browser should leave for the app now (it carries the code, or the refusal). */
  | { kind: "leave"; to: string };

/** An app (ChatGPT, Claude) asking to use this account: read the request, then allow or refuse. */
export function useConsent(id: string | null) {
  const repo = useAuthRepo();
  const [state, setState] = useState<ConsentState>(() =>
    id ? { kind: "loading" } : { kind: "error", message: "This link is missing its request. Start connecting again from the app." },
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    if (!id) return;
    repo.consentRequest(id).then(
      (r) => live && setState(r.kind === "done" ? { kind: "leave", to: r.redirectTo } : { kind: "ask", appName: r.request.appName }),
      () => live && setState({ kind: "error", message: "This request has expired or was already used. Start connecting again from the app." }),
    );
    return () => {
      live = false;
    };
  }, [id, repo]);

  const decide = useCallback(
    async (allow: boolean) => {
      if (!id) return;
      setBusy(true);
      try {
        setState({ kind: "leave", to: await repo.decideConsent(id, allow) });
      } catch {
        setBusy(false);
        setState({ kind: "error", message: "Could not finish. Start connecting again from the app." });
      }
    },
    [id, repo],
  );

  return { state, busy, allow: () => decide(true), refuse: () => decide(false) };
}
