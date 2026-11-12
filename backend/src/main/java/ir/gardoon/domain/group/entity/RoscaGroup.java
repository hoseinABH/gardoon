package ir.gardoon.domain.group.entity;

import ir.gardoon.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "rosca_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoscaGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 150)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_mode", nullable = false, length = 24)
    private CalculationMode calculationMode;

    @Column(name = "base_amount", nullable = false)
    private Long baseAmount; // in Toman

    @Column(nullable = false, length = 8)
    @Builder.Default
    private String currency = "IRT";

    @Enumerated(EnumType.STRING)
    @Column(name = "cycle_interval", nullable = false, length = 20)
    private CycleInterval cycleInterval;

    @Column(name = "jalali_due_day", nullable = false)
    private Integer jalaliDueDay; // 1-31

    @Column(name = "grace_period_hours", nullable = false)
    @Builder.Default
    private Integer gracePeriodHours = 48;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private GroupStatus status = GroupStatus.RECRUITING;

    @Column(name = "invite_code", unique = true, nullable = false, length = 16)
    private String inviteCode;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public enum CalculationMode {
        TARGET_POT,
        FIXED_CONTRIBUTION
    }

    public enum CycleInterval {
        WEEKLY,
        MONTHLY
    }

    public enum GroupStatus {
        RECRUITING,
        ACTIVE,
        COMPLETED,
        PAUSED
    }
}
