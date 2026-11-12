package ir.gardoon.domain.chat.repository;

import ir.gardoon.domain.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByGroupIdOrderByCreatedAtDesc(UUID groupId, Pageable pageable);
}
