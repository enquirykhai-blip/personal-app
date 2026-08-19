/** Join conditional class names. Kept out of ui.tsx so that file only exports components. */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
