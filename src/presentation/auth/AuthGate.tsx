"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/view-models/auth/useAuth";
import { saveReturnTo, takeReturnTo } from "./returnTo";

/** No session: everything goes to /signin, and comes back after. A signed-in account has no reason to see /signin. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { status } = useAuth(path);
  const onSignIn = path === "/signin";
  const router = useRouter();

  useEffect(() => {
    if (status === "out" && !onSignIn) {
      if (path !== "/") saveReturnTo(window.location.pathname + window.location.search);
      router.replace("/signin");
      return;
    }
    // Only where sign-in lands (/signin, or Home after the Google redirect): a stale path must not pull you away later.
    if ((status === "in" || status === "guest") && (onSignIn || path === "/")) {
      const back = takeReturnTo();
      if (back && back !== window.location.pathname + window.location.search) router.replace(back);
      else if (status === "in" && onSignIn) router.replace("/");
    }
  }, [status, onSignIn, path, router]);

  if (status === "loading" || (status === "out" && !onSignIn)) return null;
  return children;
}
