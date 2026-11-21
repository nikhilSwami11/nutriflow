/** ["a","b","c"] -> "a, b and c" */
export const joinList = (parts: string[]): string =>
  parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : (parts[0] ?? "");
