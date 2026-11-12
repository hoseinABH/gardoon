package ir.gardoon.common.util;

import org.junit.jupiter.api.Test;

import java.math.BigInteger;

import static org.junit.jupiter.api.Assertions.*;

class IranianBankingUtilTest {

    @Test
    void validatesCardNumbersUsingLuhn() {
        assertTrue(IranianBankingUtil.isValidCardNumber("6037991234567893"));
        assertTrue(IranianBankingUtil.isValidCardNumber("6037-9912-3456-7893"));
        assertFalse(IranianBankingUtil.isValidCardNumber("6037991234567890"));
        assertFalse(IranianBankingUtil.isValidCardNumber("60379912345"));
        assertFalse(IranianBankingUtil.isValidCardNumber(null));
    }

    @Test
    void detectsIranianBankByBin() {
        assertEquals("بانک ملی ایران", IranianBankingUtil.getBankNameByBin("6037991234567893"));
        assertEquals("بانک ملت", IranianBankingUtil.getBankNameByBin("6104330000000000"));
        assertEquals("بانک سامان", IranianBankingUtil.getBankNameByBin("6219861000000000"));
        assertEquals("بانک شتابی", IranianBankingUtil.getBankNameByBin("9999990000000000"));
    }

    @Test
    void validatesIranianShebaUsingMod97() {
        String bban = "0540102680020817909002";
        int rem = new BigInteger(bban + "182700").mod(BigInteger.valueOf(97)).intValue();
        int checkDigits = 98 - rem;
        String validSheba = String.format("IR%02d%s", checkDigits, bban);

        assertTrue(IranianBankingUtil.isValidSheba(validSheba));
        assertTrue(IranianBankingUtil.isValidSheba(validSheba.toLowerCase()));
        assertFalse(IranianBankingUtil.isValidSheba("IR00" + bban));
        assertFalse(IranianBankingUtil.isValidSheba("DE89370400440532013000"));
        assertFalse(IranianBankingUtil.isValidSheba("IR1234"));
    }
}
