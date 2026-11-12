package ir.gardoon.domain.obligation.entity;

import ir.gardoon.domain.round.entity.RoscaRound;
import ir.gardoon.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_obligations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"round_id", "payer_user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentObligation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    private RoscaRound round;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_user_id", nullable = false)
    private User payer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiary_user_id", nullable = false)
    private User beneficiary;

    @Column(nullable = false)
    private Long amount; // in Toman

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private ObligationStatus status = ObligationStatus.PENDING;

    @Column(name = "receipt_image_key")
    private String receiptImageKey;

    @Column(name = "tracking_reference", length = 64)
    private String trackingReference;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "idempotency_key", unique = true)
    private UUID idempotencyKey;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    public enum ObligationStatus {
        PENDING,
        RECEIPT_SUBMITTED,
        CONFIRMED,
        REJECTED
    }
}
