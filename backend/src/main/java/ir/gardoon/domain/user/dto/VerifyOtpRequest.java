package ir.gardoon.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpRequest(
    @NotBlank(message = "شماره موبایل الزامی است")
    @Pattern(regexp = "^09[0-9]{9}$", message = "شماره موبایل معتبر نیست")
    String phoneNumber,

    @NotBlank(message = "کد تایید الزامی است")
    @Pattern(regexp = "^[0-9]{5}$", message = "کد تایید باید ۵ رقم باشد")
    String code,

    String fullName
) {}
