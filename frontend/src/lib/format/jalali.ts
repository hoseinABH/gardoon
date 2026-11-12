import { toFaDigits } from "./digits";

const JALALI_DATE_PATTERN = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/;

export function formatJalali(value?: string | null): string {
  if (!value) return "—";
  const cleaned = value.trim();
  const match = cleaned.match(JALALI_DATE_PATTERN);
  if (match && Number(match[1]) < 1500) {
    const [, y, m, d] = match;
    return toFaDigits(`${y}/${m.padStart(2, "0")}/${d.padStart(2, "0")}`);
  }
  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime())) return toFaDigits(cleaned);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatJalaliTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function todayJalaliDay(): number {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
    timeZone: "Asia/Tehran",
    day: "numeric",
  }).formatToParts(new Date());
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : 15;
}
