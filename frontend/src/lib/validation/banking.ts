import { onlyDigits, toEnDigits, toFaDigits } from "@/lib/format/digits";

export interface BankEntry {
  name: string;
  logo: string;
  shebaPrefix: string;
  cardPrefixes: string[];
  color: string;
}

export const IRANIAN_BANKS: BankEntry[] = [
  { name: "بانک ملی ایران", logo: "/banks/melli.png", shebaPrefix: "017", cardPrefixes: ["603799"], color: "from-emerald-700/80 to-emerald-950" },
  { name: "بانک ملت", logo: "/banks/mellat.png", shebaPrefix: "012", cardPrefixes: ["610433", "991975"], color: "from-rose-700/75 to-neutral-950" },
  { name: "بانک صادرات ایران", logo: "/banks/saderat.png", shebaPrefix: "019", cardPrefixes: ["603769"], color: "from-blue-700/75 to-slate-950" },
  { name: "بانک تجارت", logo: "/banks/tejarat.png", shebaPrefix: "018", cardPrefixes: ["627353"], color: "from-indigo-700/80 to-slate-950" },
  { name: "بانک رفاه کارگران", logo: "/banks/refah.png", shebaPrefix: "013", cardPrefixes: ["589463"], color: "from-teal-700/75 to-slate-950" },
  { name: "بانک مسکن", logo: "/banks/maskan.png", shebaPrefix: "014", cardPrefixes: ["628023"], color: "from-orange-700/70 to-stone-950" },
  { name: "بانک سپه", logo: "/banks/sepah.png", shebaPrefix: "015", cardPrefixes: ["589210"], color: "from-amber-700/75 to-stone-900" },
  { name: "بانک کشاورزی", logo: "/banks/keshavarzi.png", shebaPrefix: "016", cardPrefixes: ["603770", "639217"], color: "from-lime-700/70 to-emerald-950" },
  { name: "بانک توسعه صادرات ایران", logo: "/banks/tosee-saderat.png", shebaPrefix: "020", cardPrefixes: ["207177", "627648"], color: "from-sky-700/75 to-slate-950" },
  { name: "پست بانک ایران", logo: "/banks/post-bank.png", shebaPrefix: "021", cardPrefixes: ["627760"], color: "from-emerald-600/75 to-slate-950" },
  { name: "بانک توسعه تعاون", logo: "/banks/taavon.png", shebaPrefix: "022", cardPrefixes: ["502908"], color: "from-cyan-700/75 to-slate-950" },
  { name: "بانک کارآفرین", logo: "/banks/karafarin.png", shebaPrefix: "053", cardPrefixes: ["627488"], color: "from-teal-700/75 to-emerald-950" },
  { name: "بانک پارسیان", logo: "/banks/parsian.png", shebaPrefix: "054", cardPrefixes: ["622106", "639194"], color: "from-amber-600/75 to-stone-950" },
  { name: "بانک اقتصاد نوین", logo: "/banks/eghtesad-novin.png", shebaPrefix: "055", cardPrefixes: ["627412"], color: "from-purple-700/75 to-slate-950" },
  { name: "بانک سامان", logo: "/banks/saman.png", shebaPrefix: "056", cardPrefixes: ["621986"], color: "from-sky-600/80 to-slate-950" },
  { name: "بانک پاسارگاد", logo: "/banks/pasargad.png", shebaPrefix: "057", cardPrefixes: ["502229", "639599"], color: "from-zinc-700/80 to-neutral-950" },
  { name: "بانک سرمایه", logo: "/banks/sarmayeh.png", shebaPrefix: "058", cardPrefixes: ["639607"], color: "from-indigo-700/75 to-neutral-950" },
  { name: "بانک سینا", logo: "/banks/sina.png", shebaPrefix: "059", cardPrefixes: ["639346"], color: "from-sky-700/75 to-neutral-950" },
  { name: "بانک قرض‌الحسنه مهر ایران", logo: "/banks/mehr.png", shebaPrefix: "060", cardPrefixes: ["606373"], color: "from-teal-700/75 to-emerald-950" },
  { name: "بانک شهر", logo: "/banks/shahr.png", shebaPrefix: "061", cardPrefixes: ["502806"], color: "from-red-700/75 to-stone-950" },
  { name: "بانک آینده", logo: "/banks/ayandeh.png", shebaPrefix: "062", cardPrefixes: ["636214"], color: "from-yellow-700/70 to-stone-950" },
  { name: "بانک گردشگری", logo: "/banks/gardeshgari.png", shebaPrefix: "064", cardPrefixes: ["505416"], color: "from-amber-700/75 to-neutral-950" },
  { name: "بانک دی", logo: "/banks/dey.png", shebaPrefix: "066", cardPrefixes: ["502938"], color: "from-cyan-700/75 to-slate-950" },
  { name: "بانک ایران زمین", logo: "/banks/iran-zamin.png", shebaPrefix: "069", cardPrefixes: ["505785"], color: "from-purple-700/75 to-neutral-950" },
  { name: "بانک قرض‌الحسنه رسالت", logo: "/banks/resalat.png", shebaPrefix: "070", cardPrefixes: ["504172"], color: "from-cyan-700/75 to-slate-950" },
  { name: "بانک ملل", logo: "/banks/melal.png", shebaPrefix: "075", cardPrefixes: ["606256"], color: "from-emerald-700/75 to-stone-950" },
  { name: "بانک خاورمیانه", logo: "/banks/khavarmianeh.png", shebaPrefix: "078", cardPrefixes: ["585983"], color: "from-teal-700/75 to-slate-950" },
  { name: "بانک مشترک ایران و ونزوئلا", logo: "/banks/iran-venezuela.png", shebaPrefix: "095", cardPrefixes: ["639370"], color: "from-rose-700/75 to-stone-950" },
];

export function phoneValid(phone: string): boolean {
  return /^09\d{9}$/.test(onlyDigits(phone));
}

export function luhnValid(cardNumber: string): boolean {
  const clean = onlyDigits(cardNumber);
  if (clean.length !== 16) return false;
  let sum = 0;
  for (let i = 0; i < 16; i += 1) {
    let digit = Number(clean[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function groupCard(cardNumber: string, latin = false): string {
  const clean = onlyDigits(cardNumber).slice(0, 16);
  const spaced = clean.replace(/(.{4})(?=.)/g, "$1 ");
  return latin ? spaced : toFaDigits(spaced);
}

export function groupSheba(sheba: string, latin = true): string {
  const clean = toEnDigits(sheba)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const spaced = clean.replace(/(.{4})(?=.)/g, "$1 ");
  return latin ? spaced : toFaDigits(spaced);
}

export function shebaValid(sheba: string): boolean {
  const clean = toEnDigits(sheba)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!/^IR\d{24}$/.test(clean)) return false;

  const rearranged = `${clean.slice(4)}1827${clean.slice(2, 4)}`;
  let remainder = 0;
  for (const ch of rearranged) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  return remainder === 1;
}

function normalizeFa(input: string): string {
  return input
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

export function detectBank(
  cardNumber?: string | null,
  iban?: string | null,
  bankName?: string | null
): { name: string; color: string; logo: string; shebaPrefix?: string } {
  const cleanCard = onlyDigits(cardNumber ?? "");
  if (cleanCard.length >= 6) {
    const prefix = cleanCard.slice(0, 6);
    const byCard = IRANIAN_BANKS.find((b) => b.cardPrefixes.includes(prefix));
    if (byCard) {
      return byCard;
    }
  }

  const cleanIban = toEnDigits(iban ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (/^IR\d{5,}/.test(cleanIban)) {
    const bankCode = cleanIban.slice(4, 7);
    const bySheba = IRANIAN_BANKS.find((b) => b.shebaPrefix === bankCode);
    if (bySheba) {
      return bySheba;
    }
  }

  if (bankName) {
    const normalized = normalizeFa(bankName);
    if (normalized) {
      const byName =
        IRANIAN_BANKS.find((b) => normalizeFa(b.name) === normalized) ??
        IRANIAN_BANKS.find(
          (b) =>
            normalizeFa(b.name).includes(normalized) ||
            normalized.includes(normalizeFa(b.name).replace(" ایران", ""))
        );
      if (byName) {
        return byName;
      }
    }
  }

  if (cleanCard.length > 0 && cleanCard.length < 6) {
    return {
      name: "کارت شتابی",
      color: "from-emerald-800/60 to-neutral-950",
      logo: "",
    };
  }

  return {
    name: cleanCard.length >= 6 ? "بانک شتابی" : "کارت شتابی",
    color: "from-emerald-800/60 to-neutral-950",
    logo: "",
  };
}
