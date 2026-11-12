package ir.gardoon.domain.chat.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.domain.chat.dto.ChatMessageDto;
import ir.gardoon.domain.chat.entity.ChatMessage;
import ir.gardoon.domain.chat.repository.ChatMessageRepository;
import ir.gardoon.domain.group.entity.GroupMember;
import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.group.repository.GroupMemberRepository;
import ir.gardoon.domain.group.repository.RoscaGroupRepository;
import ir.gardoon.domain.obligation.entity.PaymentObligation;
import ir.gardoon.domain.user.entity.User;
import ir.gardoon.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final RoscaGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(UUID groupId, UUID userId, int page, int size) {
        ensureActiveMember(groupId, userId);
        List<ChatMessageDto> list = chatMessageRepository
            .findByGroupIdOrderByCreatedAtDesc(groupId, PageRequest.of(page, size))
            .stream()
            .map(ChatMessageDto::from)
            .collect(java.util.stream.Collectors.toList());
        Collections.reverse(list);
        return list;
    }

    @Transactional
    public ChatMessageDto sendTextMessage(UUID groupId, UUID senderId, String content) {
        ensureActiveMember(groupId, senderId);
        RoscaGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND", "صندوق یافت نشد"));
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "کاربر یافت نشد"));

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
            .group(group)
            .sender(sender)
            .messageType(ChatMessage.MessageType.TEXT)
            .content(content.trim())
            .build());

        ChatMessageDto dto = ChatMessageDto.from(saved);
        broadcast(groupId, dto);
        return dto;
    }

    @Transactional
    public ChatMessageDto postSystemEvent(RoscaGroup group, String content) {
        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
            .group(group)
            .sender(null)
            .messageType(ChatMessage.MessageType.SYSTEM_EVENT)
            .content(content)
            .build());
        ChatMessageDto dto = ChatMessageDto.from(saved);
        broadcast(group.getId(), dto);
        return dto;
    }

    @Transactional
    public ChatMessageDto postReceiptCard(RoscaGroup group, User payer, PaymentObligation obligation, String content) {
        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
            .group(group)
            .sender(payer)
            .messageType(ChatMessage.MessageType.RECEIPT_CARD)
            .content(content)
            .relatedObligation(obligation)
            .build());
        ChatMessageDto dto = ChatMessageDto.from(saved);
        broadcast(group.getId(), dto);
        return dto;
    }

    private void ensureActiveMember(UUID groupId, UUID userId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "NOT_MEMBER", "شما عضو این صندوق نیستید"));
        if (member.getStatus() == GroupMember.MemberStatus.REMOVED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "MEMBER_REMOVED", "عضویت شما در این صندوق غیرفعال است");
        }
    }

    private void broadcast(UUID groupId, ChatMessageDto dto) {
        try {
            messagingTemplate.convertAndSend("/topic/group/" + groupId + "/chat", dto);
        } catch (Exception e) {
            log.warn("Failed to broadcast chat message for group {}: {}", groupId, e.getMessage());
        }
    }
}
