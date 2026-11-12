package ir.gardoon.domain.chat.entity;

import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.obligation.entity.PaymentObligation;
import ir.gardoon.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private RoscaGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id")
    private User sender; // null for automated system events

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 24)
    private MessageType messageType;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "attachment_key")
    private String attachmentKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_obligation_id")
    private PaymentObligation relatedObligation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public enum MessageType {
        TEXT,
        RECEIPT_CARD,
        SYSTEM_EVENT
    }
}
