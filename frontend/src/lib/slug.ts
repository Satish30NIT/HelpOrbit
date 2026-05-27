/** Derive internal policy_name from display title for API compatibility. */
export function titleToPolicyName(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200) || "policy";
}
