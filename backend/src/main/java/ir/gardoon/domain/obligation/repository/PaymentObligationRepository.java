package ir.gardoon.domain.obligation.repository;

import ir.gardoon.domain.obligation.entity.PaymentObligation;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentObligationRepository extends JpaRepository<PaymentObligation, UUID> {
    List<PaymentObligation> findByRoundId(UUID roundId);

    @Query("SELECT o FROM PaymentObligation o WHERE o.round.id = :cycleId")
    List<PaymentObligation> findByCycleId(@Param("cycleId") UUID cycleId);

    Optional<PaymentObligation> findByRoundIdAndPayerId(UUID roundId, UUID payerId);

    @Query("SELECT o FROM PaymentObligation o WHERE o.round.id = :cycleId AND o.payer.id = :payerId")
    Optional<PaymentObligation> findByCycleIdAndPayerId(@Param("cycleId") UUID cycleId, @Param("payerId") UUID payerId);
    Optional<PaymentObligation> findByIdempotencyKey(UUID idempotencyKey);
    List<PaymentObligation> findByPayerIdAndStatus(UUID payerId, PaymentObligation.ObligationStatus status);
    List<PaymentObligation> findByBeneficiaryIdAndStatus(UUID beneficiaryId, PaymentObligation.ObligationStatus status);
}
