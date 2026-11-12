package ir.gardoon.domain.round.dto;

import ir.gardoon.domain.round.entity.RoscaRound;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RoundDto(
        UUID id,
        UUID groupId,
        Integer roundNumber,
        LocalDate dueDate,
        String jalaliDueDateLabel,
        UUID beneficiaryUserId,
        String beneficiaryName,
        String beneficiaryAvatarUrl,
        String payoutCardSnapshot,
        String payoutIbanSnapshot,
        String payoutBankSnapshot,
        String payoutHolderSnapshot,
        Long totalPotAmount,
        Long perMemberShare,
        Integer drawTargetAngle,
        OffsetDateTime drawCompletedAt,
        RoscaRound.RoundStatus status
) {
}
