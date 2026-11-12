package ir.gardoon.domain.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record ReplaceMemberRequest(
        @NotNull(message = "شناسه عضو خروجی الزامی است")
        UUID oldMemberUserId,

        @NotBlank(message = "شماره موبایل عضو جایگزین الزامی است")
        @Pattern(regexp = "^09\\d{9}$", message = "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود")
        String replacementPhoneNumber
) {
}
