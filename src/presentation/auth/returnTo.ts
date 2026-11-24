// Where to go after signing in, so a page that needed a session (the connector consent) is not lost.
// Session storage: survives the Google round trip in the same tab, gone when the tab closes.
const KEY = "nutriflow.returnTo";

export function saveReturnTo(path: string) {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* storage blocked: the person lands on Home instead */
  }
}

/** The saved path (only same-site paths), cleared on read. */
export function takeReturnTo(): string | null {
  try {
    const p = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return p && p.startsWith("/") && !p.startsWith("//") ? p : null;
  } catch {
    return null;
  }
}
