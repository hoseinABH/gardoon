package ir.gardoon.domain.group.dto;

import ir.gardoon.domain.group.entity.RoscaGroup;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record CreateGroupRequest(
        @NotBlank(message = "عنوان صندوق الزامی است")
        @Size(min = 2, max = 150, message = "عنوان صندوق باید بین ۲ تا ۱۵۰ کاراکتر باشد")
        String title,

        @NotNull(message = "نحوه محاسبه صندوق الزامی است")
        RoscaGroup.CalculationMode calculationMode,

        @NotNull(message = "مبلغ پایه الزامی است")
        @Min(value = 10_000, message = "مبلغ پایه نمی‌تواند کمتر از ۱۰,۰۰۰ تومان باشد")
        Long baseAmount,

        @NotNull(message = "دوره پرداخت الزامی است")
        RoscaGroup.CycleInterval cycleInterval,

        @NotNull(message = "روز سررسید الزامی است")
        @Min(value = 1, message = "روز سررسید باید بین ۱ تا ۳۱ باشد")
        @Max(value = 31, message = "روز سررسید باید بین ۱ تا ۳۱ باشد")
        Integer jalaliDueDay,

        @Min(value = 1, message = "مهلت پرداخت حداقل ۱ ساعت است")
        @Max(value = 168, message = "مهلت پرداخت حداکثر ۱۶۸ ساعت است")
        Integer gracePeriodHours,

        LocalDate startDate
) {
}
