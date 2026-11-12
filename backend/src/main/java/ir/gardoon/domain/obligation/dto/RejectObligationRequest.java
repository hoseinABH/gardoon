package ir.gardoon.domain.obligation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectObligationRequest(
        @NotBlank(message = "دلیل رد رسید الزامی است")
        @Size(min = 3, max = 300, message = "دلیل رد رسید باید بین ۳ تا ۳۰۰ کاراکتر باشد")
        String reason
) {
}
