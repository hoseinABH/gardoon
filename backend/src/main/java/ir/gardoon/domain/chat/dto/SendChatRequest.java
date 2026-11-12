package ir.gardoon.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendChatRequest(
    @NotBlank(message = "متن پیام نمی‌تواند خالی باشد")
    @Size(max = 2000, message = "پیام بیش از حد طولانی است")
    String content
) {}
