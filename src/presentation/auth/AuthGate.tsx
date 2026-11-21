"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/view-models/auth/useAuth";

/** No session: everything goes to /signin. A signed-in account has no reason to see /signin. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { status } = useAuth(path);
  const onSignIn = path === "/signin";
  const router = useRouter();

  useEffect(() => {
    if (status === "out" && !onSignIn) router.replace("/signin");
    if (status === "in" && onSignIn) router.replace("/");
  }, [status, onSignIn, router]);

  if (status === "loading" || (status === "out" && !onSignIn)) return null;
  return children;
}
