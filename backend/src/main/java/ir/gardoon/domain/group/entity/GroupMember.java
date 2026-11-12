package ir.gardoon.domain.group.entity;

import ir.gardoon.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "box_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"box_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "box_id", nullable = false)
    private RoscaGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private MemberRole role = MemberRole.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private MemberStatus status = MemberStatus.ACTIVE;

    @Column(name = "has_won_pot", nullable = false)
    @Builder.Default
    private Boolean hasWonPot = false;

    @Column(name = "won_cycle_number")
    private Integer wonCycleNumber;

    public Integer getWonRoundNumber() {
        return wonCycleNumber;
    }

    public void setWonRoundNumber(Integer wonRoundNumber) {
        this.wonCycleNumber = wonRoundNumber;
    }

    public RoscaGroup getBox() {
        return group;
    }

    public void setBox(RoscaGroup box) {
        this.group = box;
    }

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private OffsetDateTime joinedAt;

    public enum MemberRole {
        OWNER,
        MEMBER
    }

    public enum MemberStatus {
        INVITED,
        ACTIVE,
        REMOVED
    }

    public static class GroupMemberBuilder {
        public GroupMemberBuilder wonRoundNumber(Integer wonRoundNumber) {
            this.wonCycleNumber = wonRoundNumber;
            return this;
        }

        public GroupMemberBuilder box(RoscaGroup box) {
            this.group = box;
            return this;
        }
    }
}
