package ir.gardoon.domain.group.dto;

import ir.gardoon.domain.group.entity.GroupMember;

import java.time.OffsetDateTime;
import java.util.UUID;

public record GroupMemberDto(
        UUID userId,
        String fullName,
        String phoneNumber,
        String avatarUrl,
        Integer avatarHue,
        GroupMember.MemberRole role,
        GroupMember.MemberStatus status,
        Boolean hasWonPot,
        Integer wonRoundNumber,
        String defaultCardNumber,
        String defaultIban,
        String defaultBankName,
        String defaultAccountHolder,
        OffsetDateTime joinedAt
) {
}
