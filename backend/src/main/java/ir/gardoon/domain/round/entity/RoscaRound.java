package ir.gardoon.domain.round.entity;

import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "rosca_rounds", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"group_id", "round_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoscaRound {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private RoscaGroup group;

    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "jalali_due_date_label", nullable = false, length = 16)
    private String jalaliDueDateLabel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiary_user_id")
    private User beneficiary;

    @Column(name = "payout_card_snapshot", length = 16)
    private String payoutCardSnapshot;

    @Column(name = "payout_iban_snapshot", length = 26)
    private String payoutIbanSnapshot;

    @Column(name = "payout_bank_snapshot", length = 64)
    private String payoutBankSnapshot;

    @Column(name = "payout_holder_snapshot", length = 120)
    private String payoutHolderSnapshot;

    @Column(name = "total_pot_amount", nullable = false)
    private Long totalPotAmount;

    @Column(name = "per_member_share", nullable = false)
    private Long perMemberShare;

    @Column(name = "draw_seed", length = 128)
    private String drawSeed;

    @Column(name = "draw_target_angle")
    private Integer drawTargetAngle;

    @Column(name = "draw_completed_at")
    private OffsetDateTime drawCompletedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private RoundStatus status = RoundStatus.PENDING_DRAW;

    public enum RoundStatus {
        PENDING_DRAW,
        COLLECTING,
        SETTLED
    }
}
