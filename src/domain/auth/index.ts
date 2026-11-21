export interface AuthUser {
  id: string;
  /** A guest session: it holds data but has no identity yet, so signing in links to it. */
  anonymous: boolean;
  email?: string;
}

export interface AuthRepository {
  /** The signed-in user, or null when there is no session. */
  current(): Promise<AuthUser | null>;
  /** Leaves the page for Google. A guest session is kept: its pantry and meals stay with the account. */
  signInWithGoogle(): Promise<void>;
  continueAsGuest(): Promise<AuthUser>;
}
