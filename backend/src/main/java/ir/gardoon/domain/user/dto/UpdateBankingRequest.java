package ir.gardoon.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBankingRequest(
    @NotBlank(message = "شماره کارت الزامی است")
    String defaultCardNumber,

    @NotBlank(message = "شماره شبا الزامی است")
    String defaultIban,

    String defaultBankName,

    @NotBlank(message = "نام صاحب حساب الزامی است")
    @Size(min = 2, max = 120, message = "نام صاحب حساب باید بین ۲ تا ۱۲۰ کاراکتر باشد")
    String defaultAccountHolder
) {}
