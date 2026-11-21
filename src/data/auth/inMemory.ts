import type { AuthRepository, AuthUser } from "@/domain/auth";

/** Without Supabase there is nothing to sign in to: a local guest, and Google says so. */
export class InMemoryAuthRepository implements AuthRepository {
  private guest: AuthUser = { id: "local", anonymous: true };
  async current() {
    return this.guest;
  }
  async signInWithGoogle(): Promise<void> {
    throw new Error("Google sign-in needs Supabase");
  }
  async continueAsGuest() {
    return this.guest;
  }
}
