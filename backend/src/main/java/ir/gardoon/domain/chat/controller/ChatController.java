package ir.gardoon.domain.chat.controller;

import ir.gardoon.common.security.SecurityUtil;
import ir.gardoon.domain.chat.dto.ChatMessageDto;
import ir.gardoon.domain.chat.dto.SendChatRequest;
import ir.gardoon.domain.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups/{groupId}/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatMessageDto>> getMessages(
        @PathVariable UUID groupId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(chatService.getMessages(groupId, SecurityUtil.currentUserId(), page, size));
    }

    @PostMapping
    public ResponseEntity<ChatMessageDto> sendMessage(
        @PathVariable UUID groupId,
        @Valid @RequestBody SendChatRequest request
    ) {
        return ResponseEntity.ok(chatService.sendTextMessage(groupId, SecurityUtil.currentUserId(), request.content()));
    }
}
