package ir.gardoon.common.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class JalaliCalendarUtilTest {

    @Test
    void convertsNowruzEquinoxCorrectly() {
        // 2025-03-21 is 1404/01/01 (Nowruz 1404)
        JalaliCalendarUtil.JalaliDate nowruz1404 = JalaliCalendarUtil.toJalali(LocalDate.of(2025, 3, 21));
        assertEquals(1404, nowruz1404.year());
        assertEquals(1, nowruz1404.month());
        assertEquals(1, nowruz1404.day());
        assertEquals("1404/01/01", nowruz1404.toIsoLabel());

        // 1403 was a leap year (1403/12/30 = 2025-03-20)
        assertTrue(JalaliCalendarUtil.isJalaliLeapYear(1403));
        assertFalse(JalaliCalendarUtil.isJalaliLeapYear(1404));
        assertEquals(30, JalaliCalendarUtil.daysInJalaliMonth(1403, 12));
        assertEquals(29, JalaliCalendarUtil.daysInJalaliMonth(1404, 12));
    }

    @Test
    void clampsDueDay31InSecondHalfOfYearAndEsfand() {
        // 1404-06-31 -> Gregorian 2025-09-22
        LocalDate start = LocalDate.of(2025, 9, 22);
        // Round index 1 (month 7 - Mehr has 30 days): day 31 clamps to 30
        LocalDate round2Due = JalaliCalendarUtil.computeRoundDueDate(start, 1, false, 31);
        JalaliCalendarUtil.JalaliDate round2Jalali = JalaliCalendarUtil.toJalali(round2Due);
        assertEquals(1404, round2Jalali.year());
        assertEquals(7, round2Jalali.month());
        assertEquals(30, round2Jalali.day());

        // Round index 6 (month 12 - Esfand 1404 non-leap has 29 days): day 31 clamps to 29
        LocalDate esfandDue = JalaliCalendarUtil.computeRoundDueDate(start, 6, false, 31);
        JalaliCalendarUtil.JalaliDate esfandJalali = JalaliCalendarUtil.toJalali(esfandDue);
        assertEquals(1404, esfandJalali.year());
        assertEquals(12, esfandJalali.month());
        assertEquals(29, esfandJalali.day());
    }

    @Test
    void computesWeeklyCyclesCorrectly() {
        LocalDate start = LocalDate.of(2025, 4, 1);
        LocalDate thirdWeek = JalaliCalendarUtil.computeRoundDueDate(start, 2, true, 1);
        assertEquals(start.plusWeeks(2), thirdWeek);
    }

    @Test
    void formatsPersianDigits() {
        assertEquals("۱۴۰۴/۱۲/۲۹", JalaliCalendarUtil.toPersianDigits("1404/12/29"));
    }
}
