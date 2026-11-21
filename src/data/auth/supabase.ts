import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AuthRepository, AuthUser } from "@/domain/auth";

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

  async continueAsGuest() {
    const { data, error } = await this.db.auth.signInAnonymously();
    if (error || !data.user) throw error ?? new Error("No user");
    return toUser(data.user);
  }
}
