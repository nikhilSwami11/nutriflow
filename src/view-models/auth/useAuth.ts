"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthMessage, type AuthUser, type SignUpResult } from "@/domain/auth";
import { useAuthRepo } from "./AuthDeps";

export type AuthStatus = "loading" | "out" | "guest" | "in";

export interface AuthModel {
  status: AuthStatus;
  email: string | null;
  busy: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  /** "confirm" = a link was emailed; null = failed (see `error`). */
  signUpWithEmail: (email: string, password: string) => Promise<SignUpResult | null>;
  /** True when signed in. */
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  /** True when a guest session started. */
  continueAsGuest: () => Promise<boolean>;
  /** Ends the session; the gate then sends you to the sign-in screen. */
  signOut: () => Promise<void>;
}

const statusOf = (u: AuthUser | null): AuthStatus => (!u ? "out" : u.anonymous ? "guest" : "in");

/** `recheckOn` (e.g. the pathname) re-reads the session when it changes. */
export function useAuth(recheckOn?: string): AuthModel {
  const repo = useAuthRepo();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keepBusy = useRef(false);

  useEffect(() => {
    let live = true;
    repo.current().then((u) => {
      if (!live) return;
      setStatus(statusOf(u));
      setEmail(u?.email ?? null);
    });
    return () => {
      live = false;
    };
  }, [repo, recheckOn]);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof AuthMessage ? e.message : "Could not sign in. Try again.");
      setBusy(false);
      return null;
    } finally {
      if (!keepBusy.current) setBusy(false);
    }
  }, []);

  // Google leaves the page on success, so busy stays on until the redirect.
  const signInWithGoogle = useCallback(async () => {
    keepBusy.current = true;
    const ok = await run(async () => (await repo.signInWithGoogle(), true));
    keepBusy.current = false;
    if (!ok) setBusy(false);
  }, [repo, run]);
  const continueAsGuest = useCallback(
    async () => (await run(async () => setStatus(statusOf(await repo.continueAsGuest())))) !== null,
    [repo, run],
  );
  const signUpWithEmail = useCallback(
    (e: string, p: string) => run(() => repo.signUpWithEmail(e.trim(), p)),
    [repo, run],
  );
  const signInWithEmail = useCallback(
    async (e: string, p: string) =>
      (await run(async () => (await repo.signInWithEmail(e.trim(), p), true))) === true,
    [repo, run],
  );

  const signOut = useCallback(
    async () => void (await run(async () => (await repo.signOut(), setStatus("out")))),
    [repo, run],
  );

  return {
    status,
    email,
    busy,
    error,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    continueAsGuest,
    signOut,
  };
}
