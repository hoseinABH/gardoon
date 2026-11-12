package ir.gardoon.domain.round.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DrawResultDto(
    UUID roundId,
    Integer roundNumber,
    UUID winnerUserId,
    String winnerName,
    String winnerAvatarUrl,
    Integer targetAngle,
    Integer sliceIndex,
    String drawSeed,
    Long potAmount,
    OffsetDateTime completedAt
) {}
