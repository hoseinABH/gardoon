package ir.gardoon.domain.group.dto;

import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.round.dto.RoundDto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record GroupDetailDto(
        UUID id,
        String title,
        UUID ownerId,
        String ownerName,
        RoscaGroup.CalculationMode calculationMode,
        Long baseAmount,
        Long totalPotAmount,
        Long perMemberShare,
        String currency,
        RoscaGroup.CycleInterval cycleInterval,
        Integer jalaliDueDay,
        LocalDate startDate,
        Integer gracePeriodHours,
        RoscaGroup.GroupStatus status,
        String inviteCode,
        List<GroupMemberDto> members,
        List<RoundDto> rounds,
        OffsetDateTime createdAt
) {
}
