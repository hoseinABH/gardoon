package ir.gardoon.domain.obligation.repository;

import ir.gardoon.domain.obligation.entity.PaymentObligation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentObligationRepository extends JpaRepository<PaymentObligation, UUID> {
    List<PaymentObligation> findByRoundId(UUID roundId);
    Optional<PaymentObligation> findByRoundIdAndPayerId(UUID roundId, UUID payerId);
    Optional<PaymentObligation> findByIdempotencyKey(UUID idempotencyKey);
    List<PaymentObligation> findByPayerIdAndStatus(UUID payerId, PaymentObligation.ObligationStatus status);
    List<PaymentObligation> findByBeneficiaryIdAndStatus(UUID beneficiaryId, PaymentObligation.ObligationStatus status);
}
