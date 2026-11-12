import { toFaDigits } from "./digits";

export function formatNumber(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return toFaDigits(safe.toLocaleString("en-US"));
}

export function formatToman(amount: number): string {
  return `${formatNumber(amount)} تومان`;
}

const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const SCALES = ["", "هزار", "میلیون", "میلیارد"];

function chunkToWords(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h > 0) parts.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]);
  } else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (t > 0) parts.push(TENS[t]);
    if (o > 0) parts.push(ONES[o]);
  }
  return parts.join(" و ");
}

export function numberToWords(value: number): string {
  const n = Math.floor(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1_000_000_000_000) return "بیش از یک تریلیون تومان";

  const groups: string[] = [];
  let rem = n;
  let scaleIndex = 0;
  while (rem > 0 && scaleIndex < SCALES.length) {
    const chunk = rem % 1000;
    if (chunk > 0) {
      const words = chunkToWords(chunk);
      const scale = SCALES[scaleIndex];
      groups.unshift(scale ? `${words} ${scale}` : words);
    }
    rem = Math.floor(rem / 1000);
    scaleIndex += 1;
  }

  return `${groups.join(" و ")} تومان`;
}
