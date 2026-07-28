/** Formatting helpers — Indonesian locale, no PII logged */

export function rupiah(n: number | null | undefined): string {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function num(n: number | null | undefined, digits = 0): string {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}

export function percent(n: number | null | undefined, digits = 2): string {
  const v = Number(n) || 0;
  return `${num(v, digits)}%`;
}

export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
