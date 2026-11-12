package ir.gardoon.domain.chat.dto;

import ir.gardoon.domain.chat.entity.ChatMessage;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ChatMessageDto(
    UUID id,
    UUID groupId,
    UUID senderUserId,
    String senderName,
    Integer senderAvatarHue,
    ChatMessage.MessageType messageType,
    String content,
    UUID relatedObligationId,
    OffsetDateTime createdAt
) {
    public static ChatMessageDto from(ChatMessage msg) {
        return new ChatMessageDto(
            msg.getId(),
            msg.getGroup().getId(),
            msg.getSender() != null ? msg.getSender().getId() : null,
            msg.getSender() != null ? msg.getSender().getFullName() : null,
            msg.getSender() != null ? msg.getSender().getAvatarHue() : null,
            msg.getMessageType(),
            msg.getContent(),
            msg.getRelatedObligation() != null ? msg.getRelatedObligation().getId() : null,
            msg.getCreatedAt()
        );
    }
}
