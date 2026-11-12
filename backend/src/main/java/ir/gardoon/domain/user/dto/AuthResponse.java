package ir.gardoon.domain.user.dto;

public record AuthResponse(
    String accessToken,
    UserProfileDto user
) {}
