package ir.gardoon.domain.user.dto;

import ir.gardoon.domain.user.entity.User;

import java.util.UUID;

public record UserProfileDto(
    UUID id,
    String phoneNumber,
    String fullName,
    String avatarUrl,
    Integer avatarHue,
    String defaultCardNumber,
    String defaultIban,
    String defaultBankName,
    String defaultAccountHolder
) {
    public static UserProfileDto from(User user) {
        return new UserProfileDto(
            user.getId(),
            user.getPhoneNumber(),
            user.getFullName(),
            user.getAvatarUrl(),
            user.getAvatarHue(),
            user.getDefaultCardNumber(),
            user.getDefaultIban(),
            user.getDefaultBankName(),
            user.getDefaultAccountHolder()
        );
    }
}
