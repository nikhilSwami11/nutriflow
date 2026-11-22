import type { SupabaseClient, User } from "@supabase/supabase-js";
import { AuthMessage, type AuthRepository, type AuthUser, type SignUpResult } from "@/domain/auth";

/** Supabase errors in plain words; anything else stays hidden behind the generic message. */
const friendly = (e: { message?: string; code?: string }): never => {
  const m = (e.message ?? "").toLowerCase();
  if (e.code === "invalid_credentials" || m.includes("invalid login"))
    throw new AuthMessage("Wrong email or password.");
  if (e.code === "email_not_confirmed")
    throw new AuthMessage("Confirm your email first. We sent you a link.");
  if (e.code === "user_already_exists" || e.code === "email_exists" || m.includes("already"))
    throw new AuthMessage("That email already has an account. Sign in instead.");
  if (e.code === "weak_password" || m.includes("password"))
    throw new AuthMessage("Use at least 6 characters for the password.");
  if (e.code === "over_email_send_rate_limit" || m.includes("rate limit"))
    throw new AuthMessage("Too many tries. Wait a minute and try again.");
  throw e;
};

const toUser = (u: User): AuthUser => ({ id: u.id, anonymous: !!u.is_anonymous, email: u.email });

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private db: SupabaseClient,
    private redirectTo: string,
  ) {}

  async current() {
    const { data } = await this.db.auth.getSession();
    return data.session ? toUser(data.session.user) : null;
  }

  async signInWithGoogle() {
    const options = { redirectTo: this.redirectTo };
    const user = await this.current();
    // linkIdentity keeps the guest's user id, so existing rows stay theirs. Needs "manual linking" on in the Supabase project.
    const { error } = user?.anonymous
      ? await this.db.auth.linkIdentity({ provider: "google", options })
      : await this.db.auth.signInWithOAuth({ provider: "google", options });
    if (error) throw error;
  }

  async signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
    const user = await this.current();
    if (user?.anonymous) {
      // Upgrading the guest keeps its user id, so existing rows stay theirs. The new email must be confirmed first.
      const { error } = await this.db.auth.updateUser(
        { email, password },
        { emailRedirectTo: this.redirectTo },
      );
      if (error) friendly(error);
      return "confirm";
    }
    const { data, error } = await this.db.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: this.redirectTo },
    });
    if (error) friendly(error);
    return data.session ? "done" : "confirm";
  }

  async signInWithEmail(email: string, password: string) {
    const { error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) friendly(error);
  }

  async signOut() {
    const { error } = await this.db.auth.signOut();
    if (error) throw error;
  }

  async continueAsGuest() {
    const { data, error } = await this.db.auth.signInAnonymously();
    if (error || !data.user) throw error ?? new Error("No user");
    return toUser(data.user);
  }
}
