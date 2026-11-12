package ir.gardoon.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SendOtpRequest(
    @NotBlank(message = "شماره موبایل الزامی است")
    @Pattern(regexp = "^09[0-9]{9}$", message = "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود")
    String phoneNumber
) {}
