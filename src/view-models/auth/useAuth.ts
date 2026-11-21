"use client";
import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "@/domain/auth";
import { useAuthRepo } from "./AuthDeps";

export type AuthStatus = "loading" | "out" | "guest" | "in";

export interface AuthModel {
  status: AuthStatus;
  busy: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  /** True when a guest session started. */
  continueAsGuest: () => Promise<boolean>;
}

const statusOf = (u: AuthUser | null): AuthStatus => (!u ? "out" : u.anonymous ? "guest" : "in");

/** `recheckOn` (e.g. the pathname) re-reads the session when it changes. */
export function useAuth(recheckOn?: string): AuthModel {
  const repo = useAuthRepo();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    repo.current().then((u) => live && setStatus(statusOf(u)));
    return () => {
      live = false;
    };
  }, [repo, recheckOn]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch {
      setError("Could not sign in. Try again.");
      setBusy(false);
      return false;
    }
  }, []);

  // Google leaves the page on success, so busy stays on until the redirect.
  const signInWithGoogle = useCallback(async () => void (await run(() => repo.signInWithGoogle())), [repo, run]);
  const continueAsGuest = useCallback(() => run(async () => setStatus(statusOf(await repo.continueAsGuest()))), [repo, run]);

  return { status, busy, error, signInWithGoogle, continueAsGuest };
}
