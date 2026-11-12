package ir.gardoon.domain.obligation.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.common.storage.LocalStorageService;
import ir.gardoon.common.util.JalaliCalendarUtil;
import ir.gardoon.domain.chat.service.ChatService;
import ir.gardoon.domain.group.entity.GroupMember;
import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.group.repository.GroupMemberRepository;
import ir.gardoon.domain.group.repository.RoscaGroupRepository;
import ir.gardoon.domain.obligation.dto.ObligationDto;
import ir.gardoon.domain.obligation.entity.PaymentObligation;
import ir.gardoon.domain.obligation.repository.PaymentObligationRepository;
import ir.gardoon.domain.round.entity.RoscaRound;
import ir.gardoon.domain.round.repository.RoscaRoundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ObligationService {

    private final PaymentObligationRepository obligationRepository;
    private final RoscaRoundRepository roundRepository;
    private final RoscaGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final LocalStorageService localStorageService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ObligationDto> getObligationsForRound(UUID roundId, UUID currentUserId) {
        RoscaRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND", "دور مورد نظر یافت نشد"));

        ensureActiveMember(round.getGroup().getId(), currentUserId);

        return obligationRepository.findByRoundId(roundId)
                .stream()
                .map(ObligationService::toDto)
                .toList();
    }

    @Transactional
    public ObligationDto submitReceipt(
            UUID obligationId,
            UUID payerId,
            MultipartFile file,
            String trackingReference,
            UUID idempotencyKey
    ) {
        if (idempotencyKey != null) {
            Optional<PaymentObligation> duplicate = obligationRepository.findByIdempotencyKey(idempotencyKey);
            if (duplicate.isPresent()) {
                PaymentObligation existing = duplicate.get();
                if (existing.getId().equals(obligationId) && existing.getPayer().getId().equals(payerId)) {
                    return toDto(existing);
                }
                throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_IDEMPOTENCY_KEY", "این رسید قبلاً ثبت شده است");
            }
        }

        PaymentObligation obligation = obligationRepository.findById(obligationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "OBLIGATION_NOT_FOUND", "قسط مورد نظر یافت نشد"));

        if (!obligation.getPayer().getId().equals(payerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ONLY_PAYER_CAN_SUBMIT", "فقط پرداخت‌کننده قسط می‌تواند رسید ارسال کند");
        }

        if (obligation.getRound().getStatus() != RoscaRound.RoundStatus.COLLECTING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ROUND_NOT_COLLECTING", "این دور در مرحله جمع‌آوری اقساط نیست");
        }

        if (obligation.getStatus() != PaymentObligation.ObligationStatus.PENDING
                && obligation.getStatus() != PaymentObligation.ObligationStatus.REJECTED) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_OBLIGATION_STATE", "رسید این قسط قبلاً ارسال یا تایید شده است");
        }

        String storageKey = localStorageService.storeReceipt(file);
        obligation.setReceiptImageKey(storageKey);
        obligation.setTrackingReference(trackingReference != null && !trackingReference.isBlank() ? trackingReference.trim() : null);
        obligation.setIdempotencyKey(idempotencyKey);
        obligation.setRejectionReason(null);
        obligation.setSubmittedAt(OffsetDateTime.now());
        obligation.setStatus(PaymentObligation.ObligationStatus.RECEIPT_SUBMITTED);

        PaymentObligation saved = obligationRepository.save(obligation);

        String roundFa = JalaliCalendarUtil.toPersianDigits(String.valueOf(saved.getRound().getRoundNumber()));
        chatService.postReceiptCard(
                saved.getRound().getGroup(),
                saved.getPayer(),
                saved,
                "رسید واریز قسط دور " + roundFa + " ارسال شد."
        );

        ObligationDto dto = toDto(saved);
        broadcastObligation(saved.getRound().getGroup().getId(), dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public ReceiptImagePayload loadReceiptImage(UUID obligationId, UUID currentUserId) {
        PaymentObligation obligation = obligationRepository.findById(obligationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "OBLIGATION_NOT_FOUND", "قسط مورد نظر یافت نشد"));

        ensureActiveMember(obligation.getRound().getGroup().getId(), currentUserId);

        Resource resource = localStorageService.loadReceipt(obligation.getReceiptImageKey());
        String key = obligation.getReceiptImageKey().toLowerCase();
        MediaType mediaType = MediaType.IMAGE_JPEG;
        if (key.endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
        } else if (key.endsWith(".webp")) {
            mediaType = MediaType.parseMediaType("image/webp");
        }
        return new ReceiptImagePayload(resource, mediaType);
    }

    @Transactional
    public ObligationDto confirmObligation(UUID obligationId, UUID actorUserId) {
        PaymentObligation obligation = obligationRepository.findById(obligationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "OBLIGATION_NOT_FOUND", "قسط مورد نظر یافت نشد"));

        RoscaRound round = obligation.getRound();
        RoscaGroup group = round.getGroup();

        ensureCanReviewObligation(obligation, group, actorUserId);

        if (obligation.getStatus() != PaymentObligation.ObligationStatus.RECEIPT_SUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_OBLIGATION_STATE", "فقط رسیدهای در انتظار تایید قابل تایید هستند");
        }

        obligation.setStatus(PaymentObligation.ObligationStatus.CONFIRMED);
        obligation.setConfirmedAt(OffsetDateTime.now());
        PaymentObligation saved = obligationRepository.save(obligation);

        String roundFa = JalaliCalendarUtil.toPersianDigits(String.valueOf(round.getRoundNumber()));
        chatService.postSystemEvent(
                group,
                "واریز قسط " + saved.getPayer().getFullName() + " برای دور " + roundFa + " تایید شد."
        );

        // Settle round if all obligations for the round are confirmed
        List<PaymentObligation> roundObligations = obligationRepository.findByRoundId(round.getId());
        boolean allConfirmed = !roundObligations.isEmpty() && roundObligations.stream()
                .allMatch(ob -> ob.getStatus() == PaymentObligation.ObligationStatus.CONFIRMED);

        if (allConfirmed && round.getStatus() != RoscaRound.RoundStatus.SETTLED) {
            round.setStatus(RoscaRound.RoundStatus.SETTLED);
            roundRepository.save(round);
            chatService.postSystemEvent(
                    group,
                    "تمام اقساط دور " + roundFa + " تایید و این دور تسویه شد."
            );

            List<RoscaRound> allRounds = roundRepository.findByGroupIdOrderByRoundNumberAsc(group.getId());
            boolean allRoundsSettled = !allRounds.isEmpty() && allRounds.stream()
                    .allMatch(r -> r.getStatus() == RoscaRound.RoundStatus.SETTLED);
            if (allRoundsSettled && group.getStatus() != RoscaGroup.GroupStatus.COMPLETED) {
                group.setStatus(RoscaGroup.GroupStatus.COMPLETED);
                groupRepository.save(group);
                chatService.postSystemEvent(
                        group,
                        "تمام دورهای صندوق «" + group.getTitle() + "» با موفقیت تسویه و صندوق تکمیل شد."
                );
            }
        }

        ObligationDto dto = toDto(saved);
        broadcastObligation(group.getId(), dto);
        return dto;
    }

    @Transactional
    public ObligationDto rejectObligation(UUID obligationId, UUID actorUserId, String reason) {
        PaymentObligation obligation = obligationRepository.findById(obligationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "OBLIGATION_NOT_FOUND", "قسط مورد نظر یافت نشد"));

        RoscaRound round = obligation.getRound();
        RoscaGroup group = round.getGroup();

        ensureCanReviewObligation(obligation, group, actorUserId);

        if (obligation.getStatus() != PaymentObligation.ObligationStatus.RECEIPT_SUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_OBLIGATION_STATE", "فقط رسیدهای در انتظار تایید قابل رد هستند");
        }

        obligation.setStatus(PaymentObligation.ObligationStatus.REJECTED);
        obligation.setRejectionReason(reason.trim());
        PaymentObligation saved = obligationRepository.save(obligation);

        String roundFa = JalaliCalendarUtil.toPersianDigits(String.valueOf(round.getRoundNumber()));
        chatService.postSystemEvent(
                group,
                "رسید واریز " + saved.getPayer().getFullName() + " در دور " + roundFa + " رد شد: " + reason.trim()
        );

        ObligationDto dto = toDto(saved);
        broadcastObligation(group.getId(), dto);
        return dto;
    }

    private void ensureActiveMember(UUID groupId, UUID userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .filter(m -> m.getStatus() == GroupMember.MemberStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "NOT_A_MEMBER", "شما عضو این صندوق نیستید"));
    }

    private void ensureCanReviewObligation(PaymentObligation obligation, RoscaGroup group, UUID actorUserId) {
        boolean isBeneficiary = obligation.getBeneficiary().getId().equals(actorUserId);
        boolean isOwner = group.getOwner().getId().equals(actorUserId);
        if (!isBeneficiary && !isOwner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_REVIEW", "فقط برنده دور یا مدیر صندوق مجاز به تایید یا رد رسید است");
        }
    }

    private void broadcastObligation(UUID groupId, ObligationDto dto) {
        try {
            messagingTemplate.convertAndSend("/topic/group/" + groupId + "/obligations", dto);
        } catch (Exception e) {
            log.warn("Failed to broadcast obligation update: {}", e.getMessage());
        }
    }

    public static ObligationDto toDto(PaymentObligation obligation) {
        String receiptUrl = obligation.getReceiptImageKey() != null
                ? "/api/obligations/" + obligation.getId() + "/receipt-image"
                : null;
        return new ObligationDto(
                obligation.getId(),
                obligation.getRound().getId(),
                obligation.getRound().getRoundNumber(),
                obligation.getPayer().getId(),
                obligation.getPayer().getFullName(),
                obligation.getPayer().getPhoneNumber(),
                obligation.getPayer().getAvatarHue(),
                obligation.getBeneficiary().getId(),
                obligation.getBeneficiary().getFullName(),
                obligation.getAmount(),
                obligation.getStatus(),
                receiptUrl,
                obligation.getTrackingReference(),
                obligation.getRejectionReason(),
                obligation.getSubmittedAt(),
                obligation.getConfirmedAt()
        );
    }

    public record ReceiptImagePayload(Resource resource, MediaType mediaType) {
    }
}
