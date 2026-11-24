"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/view-models/auth/useAuth";
import { LoopAnimation } from "./LoopAnimation";
import { takeReturnTo } from "./returnTo";

export function SignInScreen() {
  const a = useAuth();
  const router = useRouter();
  const go = () => router.replace(takeReturnTo() ?? "/");
  const [emailOpen, setEmailOpen] = useState(false);
  const [mode, setMode] = useState<"up" | "in">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSent(false);
    if (mode === "in") {
      if (await a.signInWithEmail(email, password)) go();
      return;
    }
    const r = await a.signUpWithEmail(email, password);
    if (r === "done") go();
    if (r === "confirm") setSent(true);
  };

  return (
    <main className="flex min-h-dvh flex-col">
      {/* Same wordmark as the Home header. */}
      <header className="mx-auto w-full max-w-md px-5 pt-4 lg:max-w-6xl lg:px-10 lg:pt-8">
        <p className="m-0 text-[22px] font-medium tracking-[-0.02em] lg:text-[26px]">NutriFlow</p>
      </header>
      <div className="mx-auto grid w-full max-w-md flex-1 content-start gap-3 px-5 py-4 lg:content-center lg:py-6 lg:max-w-6xl lg:grid-cols-2 lg:grid-rows-2 lg:gap-x-12 lg:gap-y-8 lg:px-10">
        <section className="flex flex-col gap-3 lg:col-start-2 lg:w-full lg:max-w-[400px] lg:self-end">
          <div>
            <h1 className="m-0 text-balance text-[24px] font-medium leading-[1.15] tracking-[-0.025em] lg:text-[44px] lg:leading-[1.1] lg:tracking-[-0.03em]">
              Your next meal, already figured out.
            </h1>
            <p className="mt-2 max-w-[36ch] text-sm leading-[1.45] text-ink2 lg:mt-3 lg:text-[15px] lg:leading-[1.5]">
              NutriFlow’s AI picks a meal for your goal and pantry, shops for what is missing, cooks with you
              and logs it.
            </p>
          </div>
        </section>
        <div className="flex lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:items-center">
          <LoopAnimation />
        </div>
        <section className="flex flex-col gap-3 lg:col-start-2 lg:w-full lg:max-w-[400px] lg:self-start">
          <button
            type="button"
            onClick={async () => (await a.continueAsGuest()) && go()}
            disabled={a.busy}
            className="touch min-h-12 rounded-full border-0 bg-ink px-5 text-[15px] font-medium text-bg disabled:opacity-60"
          >
            Get started
          </button>
          <button
            type="button"
            onClick={a.signInWithGoogle}
            disabled={a.busy}
            className="touch flex min-h-12 items-center justify-center gap-3 rounded-full border border-line2 bg-bg px-5 text-[15px] font-medium disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
              />
              <path
                fill="#FBBC05"
                d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            Continue with Google
          </button>
          {!emailOpen ? (
            <button
              type="button"
              onClick={() => setEmailOpen(true)}
              className="touch min-h-11 rounded-full border-0 bg-transparent px-5 text-sm font-medium text-ink2"
            >
              Use email instead
            </button>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
              <label className="sr-only" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="min-h-12 rounded-full border border-line2 bg-bg px-5 text-[15px] outline-none focus:border-ink"
              />
              <label className="sr-only" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "up" ? "Password, 6 or more characters" : "Password"}
                className="min-h-12 rounded-full border border-line2 bg-bg px-5 text-[15px] outline-none focus:border-ink"
              />
              <button
                type="submit"
                disabled={a.busy || !email || password.length < 6}
                className="touch min-h-12 rounded-full border border-line2 bg-bg px-5 text-[15px] font-medium disabled:opacity-60"
              >
                {mode === "up" ? "Create account" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "up" ? "in" : "up");
                  setSent(false);
                }}
                className="touch min-h-11 rounded-full border-0 bg-transparent px-5 text-sm font-medium text-ink2"
              >
                {mode === "up" ? "Have an account? Sign in" : "New here? Create an account"}
              </button>
            </form>
          )}
          {sent && (
            <p role="status" className="m-0 text-center text-sm text-ink2">
              Check your email and tap the link to finish. Your pantry and meals stay with you.
            </p>
          )}
          {a.error && (
            <p role="alert" className="m-0 text-center text-sm text-ink2">
              {a.error}
            </p>
          )}
          <p className="m-0 text-center text-xs text-ink2">
            Free. Google keeps your pantry and meals on every device.
          </p>
        </section>
      </div>
    </main>
  );
}
