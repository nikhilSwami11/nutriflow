export interface AuthUser {
  id: string;
  /** A guest session: it holds data but has no identity yet, so signing in links to it. */
  anonymous: boolean;
  email?: string;
}

/** An error whose message is safe to show the user as it is. */
export class AuthMessage extends Error {}

export type SignUpResult = "done" | "confirm";

export interface AuthRepository {
  /** The signed-in user, or null when there is no session. */
  current(): Promise<AuthUser | null>;
  /** Leaves the page for Google. A guest session is kept: its pantry and meals stay with the account. */
  signInWithGoogle(): Promise<void>;
  /** Makes an account. A guest session is upgraded in place, so its pantry and meals stay. "confirm" = a link was emailed first. */
  signUpWithEmail(email: string, password: string): Promise<SignUpResult>;
  signInWithEmail(email: string, password: string): Promise<void>;
  continueAsGuest(): Promise<AuthUser>;
  signOut(): Promise<void>;
}
