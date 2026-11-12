package ir.gardoon.common.util;

public final class IranianBankingUtil {

    private IranianBankingUtil() {}

    /**
     * Validates a 16-digit Iranian bank card using the Luhn algorithm.
     */
    public static boolean isValidCardNumber(String cardNumber) {
        if (cardNumber == null) {
            return false;
        }
        String clean = cardNumber.replaceAll("[^0-9]", "");
        if (clean.length() != 16) {
            return false;
        }

        int sum = 0;
        for (int i = 0; i < 16; i++) {
            int digit = Character.getNumericValue(clean.charAt(i));
            if (i % 2 == 0) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
        }
        return sum % 10 == 0;
    }

    /**
     * Resolves Iranian bank name by 6-digit BIN.
     */
    public static String getBankNameByBin(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 6) {
            return "بانک نامشخص";
        }
        String bin = cardNumber.replaceAll("[^0-9]", "").substring(0, 6);
        return switch (bin) {
            case "603799" -> "بانک ملی ایران";
            case "589210" -> "بانک سپه";
            case "627648", "207177" -> "بانک توسعه صادرات";
            case "627961" -> "بانک صنعت و معدن";
            case "603770" -> "بانک کشاورزی";
            case "628023" -> "بانک مسکن";
            case "627760" -> "پست بانک ایران";
            case "621986" -> "بانک سامان";
            case "639346" -> "بانک سینا";
            case "639607" -> "بانک سرمایه";
            case "636214" -> "بانک آینده";
            case "502229", "639599" -> "بانک پاسارگاد";
            case "610433", "991975" -> "بانک ملت";
            case "627353", "585983" -> "بانک تجارت";
            case "589463" -> "بانک رفاه کارگران";
            case "622106", "639194" -> "بانک پارسیان";
            case "505416" -> "بانک گردشگری";
            case "606373" -> "بانک قرض‌الحسنه مهر ایران";
            case "505785" -> "بانک ایران زمین";
            case "636795" -> "بانک مرکزی";
            case "603769" -> "بانک صادرات ایران";
            case "627488" -> "بانک کارآفرین";
            case "505801" -> "موسسه اعتباری کوثر";
            case "639217" -> "بانک کشاورزی";
            case "502908" -> "بانک توسعه تعاون";
            case "504172" -> "بانک رسالت";
            case "507677" -> "بانک موسسه نور";
            case "502806" -> "بانک شهر";
            default -> "بانک شتابی";
        };
    }

    /**
     * Validates Iranian IBAN (Sheba): IR + 24 digits with ISO-7064 Mod-97-10 check.
     */
    public static boolean isValidSheba(String sheba) {
        if (sheba == null) {
            return false;
        }
        String clean = sheba.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (!clean.matches("^IR[0-9]{24}$")) {
            return false;
        }

        // ISO 7064 Mod 97-10 algorithm
        // Move "IR" to end and convert letters: I=18, R=27
        String rearranged = clean.substring(4) + "1827" + clean.substring(2, 4);
        java.math.BigInteger num = new java.math.BigInteger(rearranged);
        return num.mod(java.math.BigInteger.valueOf(97)).intValue() == 1;
    }
}
