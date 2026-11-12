package ir.gardoon.domain.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinGroupRequest(
        @NotBlank(message = "کد دعوت الزامی است")
        @Size(min = 4, max = 16, message = "کد دعوت نامعتبر است")
        String inviteCode
) {
}
