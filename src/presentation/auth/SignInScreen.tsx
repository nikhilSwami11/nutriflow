"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/view-models/auth/useAuth";

export function SignInScreen() {
  const a = useAuth();
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-5 py-10">
      <div>
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Welcome to NutriFlow</h1>
        <p className="mt-2 text-[15px] leading-[1.45] text-ink2">Sign in to keep your pantry and meals safe.</p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={a.signInWithGoogle}
          disabled={a.busy}
          className="touch flex min-h-11 items-center justify-center gap-3 rounded-full border border-line2 bg-bg px-5 text-[15px] font-medium disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
            <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          Continue with Google
        </button>
        <button
          type="button"
          onClick={async () => (await a.continueAsGuest()) && router.replace("/")}
          disabled={a.busy}
          className="touch min-h-11 rounded-full border-0 bg-transparent px-5 text-sm font-medium text-ink2 disabled:opacity-60"
        >
          Not now
        </button>
        {a.error && (
          <p role="alert" className="m-0 text-center text-sm text-ink2">
            {a.error}
          </p>
        )}
      </div>
    </main>
  );
}
