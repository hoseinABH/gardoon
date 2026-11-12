import { describe, expect, it } from "vitest";
import { cn, onlyDigits, toEnDigits, toFaDigits } from "../digits";
import { formatNumber, formatToman, numberToWords } from "../money";
import { formatJalali, todayJalaliDay } from "../jalali";

describe("digits utilities", () => {
  it("converts Persian and Arabic digits to ASCII", () => {
    expect(toEnDigits("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(toEnDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    expect(toEnDigits("IR۰۶۲۹")).toBe("IR0629");
  });

  it("converts ASCII digits to Persian digits cleanly", () => {
    expect(toFaDigits("12345")).toBe("۱۲۳۴۵");
    expect(toFaDigits(980)).toBe("۹۸۰");
    expect(toFaDigits(null)).toBe("");
    expect(toFaDigits(undefined)).toBe("");
  });

  it("extracts digits only after normalizing Persian/Arabic numerals", () => {
    expect(onlyDigits("۶۰۳۷-۹۹۷۵-۹۹۱۲-۳۴۵۶")).toBe("6037997599123456");
    expect(onlyDigits("abc ٠٩١٢ def")).toBe("0912");
  });

  it("joins class names skipping falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("money formatting and Persian words", () => {
  it("formats numbers and Toman amounts in Persian numerals", () => {
    expect(formatNumber(10_000_000)).toBe("۱۰,۰۰۰,۰۰۰");
    expect(formatToman(2_500_000)).toBe("۲,۵۰۰,۰۰۰ تومان");
    expect(formatNumber(Number.NaN)).toBe("۰");
  });

  it("converts numeric Toman values to Persian words", () => {
    expect(numberToWords(0)).toBe("");
    expect(numberToWords(-500)).toBe("");
    expect(numberToWords(500_000)).toBe("پانصد هزار تومان");
    expect(numberToWords(10_000_000)).toBe("ده میلیون تومان");
    expect(numberToWords(12_350_000)).toBe("دوازده میلیون و سیصد و پنجاه هزار تومان");
    expect(numberToWords(1_000_000_000_000)).toBe("بیش از یک تریلیون تومان");
  });
});

describe("jalali calendar formatting", () => {
  it("keeps explicit Jalali dates and normalizes digits", () => {
    expect(formatJalali("1404/2/5")).toBe("۱۴۰۴/۰۲/۰۵");
    expect(formatJalali(null)).toBe("—");
  });

  it("formats ISO dates to Persian calendar and returns valid today Jalali day", () => {
    const formatted = formatJalali("2025-03-21T10:00:00Z");
    expect(formatted).toContain("۱۴۰۴");
    const day = todayJalaliDay();
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  });
});
