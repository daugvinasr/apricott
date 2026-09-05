export function pickChoice<T extends number>(
  options: readonly T[],
  value: string | null,
): T | undefined {
  return options.find((o) => String(o) === value);
}
