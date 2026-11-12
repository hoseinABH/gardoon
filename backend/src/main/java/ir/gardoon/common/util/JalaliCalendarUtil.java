package ir.gardoon.common.util;

import java.time.LocalDate;

/**
 * Pure Java Shamsi (Jalali) calendar conversion and due-date calculation utility.
 * Uses the standard 33-year / algorithmic Iranian calendar conversion with zero external dependencies.
 */
public final class JalaliCalendarUtil {

    private static final String[] PERSIAN_MONTHS = {
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    };

    private JalaliCalendarUtil() {}

    public record JalaliDate(int year, int month, int day) {
        public String toIsoLabel() {
            return String.format("%04d/%02d/%02d", year, month, day);
        }

        public String toShortPersianLabel() {
            return toPersianDigits(day + " " + PERSIAN_MONTHS[month - 1]);
        }
    }

    /**
     * Checks if a Jalali year is a leap year (30 days in Esfand).
     */
    public static boolean isJalaliLeapYear(int jy) {
        int[] breaks = {-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178};
        int jp = breaks[0];
        int jump = 0;
        for (int j = 1; j < breaks.length; j++) {
            int jm = breaks[j];
            jump = jm - jp;
            if (jy < jm) {
                break;
            }
            jp = jm;
        }
        int n = jy - jp;
        if (jump - n < 6) {
            n = n - jump + ((jump + 4) / 33) * 33;
        }
        int leap = ((n + 1) % 33 - 1) % 4;
        if (leap == -1) {
            leap = 4;
        }
        return leap == 0;
    }

    /**
     * Returns the number of days in a given Jalali year and month (1-12).
     */
    public static int daysInJalaliMonth(int jy, int jm) {
        if (jm <= 6) {
            return 31;
        }
        if (jm <= 11) {
            return 30;
        }
        return isJalaliLeapYear(jy) ? 30 : 29;
    }

    /**
     * Converts a Gregorian LocalDate to a JalaliDate.
     */
    public static JalaliDate toJalali(LocalDate date) {
        int gy = date.getYear();
        int gm = date.getMonthValue();
        int gd = date.getDayOfMonth();

        int[] gdm = {0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334};
        int gy2 = (gm > 2) ? (gy + 1) : gy;
        int days = 355666 + (365 * gy) + ((gy2 + 3) / 4) - ((gy2 + 99) / 100) + ((gy2 + 399) / 400) + gd + gdm[gm - 1];
        int jy = -1595 + (33 * (days / 12053));
        days %= 12053;
        jy += 4 * (days / 1461);
        days %= 1461;
        if (days > 365) {
            jy += (days - 1) / 365;
            days = (days - 1) % 365;
        }
        int jm = (days < 186) ? 1 + (days / 31) : 7 + ((days - 186) / 30);
        int jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
        return new JalaliDate(jy, jm, jd);
    }

    /**
     * Converts a Jalali year/month/day to a Gregorian LocalDate.
     */
    public static LocalDate toGregorian(int jy, int jm, int jd) {
        int jy2 = jy + 1595;
        int days = -355668 + (365 * jy2) + ((jy2 / 33) * 8) + (((jy2 % 33) + 3) / 4) + jd
                + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
        int gy = 400 * (days / 146097);
        days %= 146097;
        if (days > 36524) {
            gy += 100 * (--days / 36524);
            days %= 36524;
            if (days >= 365) {
                days++;
            }
        }
        gy += 4 * (days / 1461);
        days %= 1461;
        if (days > 365) {
            gy += (days - 1) / 365;
            days = (days - 1) % 365;
        }
        int gd = days + 1;
        int[] salA = {0, 31, ((gy % 4 == 0 && gy % 100 != 0) || (gy % 400 == 0)) ? 29 : 28,
                31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
        int gm;
        for (gm = 0; gm < 13 && gd > salA[gm]; gm++) {
            gd -= salA[gm];
        }
        return LocalDate.of(gy, gm, gd);
    }

    /**
     * Computes the Gregorian due date for roundIndex (0-based) given a base start date,
     * clamping the desired jalaliDueDay (1..31) to the last valid day of shorter Jalali months (e.g. 29/30 Esfand).
     */
    public static LocalDate computeRoundDueDate(LocalDate startDate, int roundIndex, boolean weekly, int jalaliDueDay) {
        if (weekly) {
            return startDate.plusWeeks(roundIndex);
        }
        JalaliDate startJ = toJalali(startDate);
        int totalMonths = (startJ.month() - 1) + roundIndex;
        int targetYear = startJ.year() + (totalMonths / 12);
        int targetMonth = (totalMonths % 12) + 1;

        int maxDay = daysInJalaliMonth(targetYear, targetMonth);
        int clampedDay = Math.min(Math.max(1, jalaliDueDay), maxDay);
        return toGregorian(targetYear, targetMonth, clampedDay);
    }

    public static String toPersianDigits(String input) {
        if (input == null) return "";
        char[] persian = {'۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'};
        StringBuilder sb = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (c >= '0' && c <= '9') {
                sb.append(persian[c - '0']);
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
