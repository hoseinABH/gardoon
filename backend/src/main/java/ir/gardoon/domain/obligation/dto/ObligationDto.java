package ir.gardoon.domain.obligation.dto;

import ir.gardoon.domain.obligation.entity.PaymentObligation;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ObligationDto(
        UUID id,
        UUID roundId,
        Integer roundNumber,
        UUID payerUserId,
        String payerName,
        String payerPhoneNumber,
        Integer payerAvatarHue,
        UUID beneficiaryUserId,
        String beneficiaryName,
        Long amount,
        PaymentObligation.ObligationStatus status,
        String receiptImageUrl,
        String trackingReference,
        String rejectionReason,
        OffsetDateTime submittedAt,
        OffsetDateTime confirmedAt
) {
}
