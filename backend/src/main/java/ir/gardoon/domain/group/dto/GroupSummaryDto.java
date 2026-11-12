package ir.gardoon.domain.group.dto;

import ir.gardoon.domain.group.entity.RoscaGroup;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record GroupSummaryDto(
        UUID id,
        String title,
        UUID ownerId,
        String ownerName,
        RoscaGroup.CalculationMode calculationMode,
        Long baseAmount,
        Long estimatedPotAmount,
        Long estimatedPerMemberShare,
        String currency,
        RoscaGroup.CycleInterval cycleInterval,
        Integer jalaliDueDay,
        LocalDate startDate,
        Integer gracePeriodHours,
        RoscaGroup.GroupStatus status,
        String inviteCode,
        int memberCount,
        int completedRounds,
        int totalRounds,
        OffsetDateTime createdAt
) {
}
