export interface AuthUser {
  id: string;
  /** A guest session: it holds data but has no identity yet, so signing in links to it. */
  anonymous: boolean;
  email?: string;
}

/** An error whose message is safe to show the user as it is. */
export class AuthMessage extends Error {}

export type SignUpResult = "done" | "confirm";

/** An app (ChatGPT, Claude) asking to use this account through the connector. */
export interface ConsentRequest {
  id: string;
  appName: string;
}

/** Either the app still needs a yes or no, or it was already allowed and the browser goes straight back to it. */
export type ConsentLookup = { kind: "ask"; request: ConsentRequest } | { kind: "done"; redirectTo: string };

/** An app this account has allowed through the connector. */
export interface ConnectedApp {
  name: string;
  /** ISO date-time it was allowed. */
  since: string;
}

export type Assistant = "claude" | "chatgpt";

/** Which assistant a connected app is, by the name it registered with; null when it is neither. */
export const assistantOf = (name: string): Assistant | null => {
  const n = name.toLowerCase();
  if (n.includes("claude") || n.includes("anthropic")) return "claude";
  if (n.includes("chatgpt") || n.includes("openai")) return "chatgpt";
  return null;
};

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
  /** Reads a connector sign-in request by the id in the consent page URL. */
  consentRequest(id: string): Promise<ConsentLookup>;
  /** Allows or refuses it. Returns where to send the browser: back to the app, with a code or with a refusal. */
  decideConsent(id: string, allow: boolean): Promise<string>;
  /** Apps allowed through the connector, newest first. */
  connectedApps(): Promise<ConnectedApp[]>;
}
