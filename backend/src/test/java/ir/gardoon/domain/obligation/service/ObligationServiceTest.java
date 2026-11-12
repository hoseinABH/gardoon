package ir.gardoon.domain.obligation.service;

import ir.gardoon.common.storage.LocalStorageService;
import ir.gardoon.domain.chat.service.ChatService;
import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.group.repository.GroupMemberRepository;
import ir.gardoon.domain.group.repository.RoscaGroupRepository;
import ir.gardoon.domain.obligation.dto.ObligationDto;
import ir.gardoon.domain.obligation.entity.PaymentObligation;
import ir.gardoon.domain.obligation.repository.PaymentObligationRepository;
import ir.gardoon.domain.round.entity.RoscaRound;
import ir.gardoon.domain.round.repository.RoscaRoundRepository;
import ir.gardoon.domain.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ObligationServiceTest {

    @Mock private PaymentObligationRepository obligationRepository;
    @Mock private RoscaRoundRepository roundRepository;
    @Mock private RoscaGroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private LocalStorageService localStorageService;
    @Mock private ChatService chatService;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks private ObligationService obligationService;

    @Test
    void confirmsLastObligationSettlesRoundAndCompletesGroup() {
        UUID ownerId = UUID.randomUUID();
        UUID beneficiaryId = UUID.randomUUID();
        UUID payerId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID obId = UUID.randomUUID();

        User owner = User.builder().id(ownerId).fullName("مدیر").build();
        User beneficiary = User.builder().id(beneficiaryId).fullName("برنده").build();
        User payer = User.builder().id(payerId).fullName("پرداخت‌کننده").phoneNumber("09120000001").avatarHue(120).build();

        RoscaGroup group = RoscaGroup.builder()
                .id(groupId)
                .owner(owner)
                .title("صندوق همکاران")
                .status(RoscaGroup.GroupStatus.ACTIVE)
                .build();

        RoscaRound round = RoscaRound.builder()
                .id(roundId)
                .group(group)
                .roundNumber(1)
                .status(RoscaRound.RoundStatus.COLLECTING)
                .build();

        PaymentObligation obligation = PaymentObligation.builder()
                .id(obId)
                .round(round)
                .payer(payer)
                .beneficiary(beneficiary)
                .amount(5_000_000L)
                .status(PaymentObligation.ObligationStatus.RECEIPT_SUBMITTED)
                .receiptImageKey("receipt.jpg")
                .build();

        when(obligationRepository.findById(obId)).thenReturn(Optional.of(obligation));
        when(obligationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(obligationRepository.findByRoundId(roundId)).thenReturn(List.of(obligation));
        when(roundRepository.findByGroupIdOrderByRoundNumberAsc(groupId)).thenReturn(List.of(round));

        ObligationDto dto = obligationService.confirmObligation(obId, beneficiaryId);

        assertEquals(PaymentObligation.ObligationStatus.CONFIRMED, dto.status());
        assertEquals(RoscaRound.RoundStatus.SETTLED, round.getStatus());
        assertEquals(RoscaGroup.GroupStatus.COMPLETED, group.getStatus());
        verify(groupRepository).save(group);
    }

    @Test
    void submitReceiptHonorsIdempotencyKeyWithoutStoringTwice() {
        UUID payerId = UUID.randomUUID();
        UUID obId = UUID.randomUUID();
        UUID idemKey = UUID.randomUUID();

        User payer = User.builder().id(payerId).fullName("مهدی").phoneNumber("09123333333").avatarHue(200).build();
        User beneficiary = User.builder().id(UUID.randomUUID()).fullName("سارا").build();
        RoscaGroup group = RoscaGroup.builder().id(UUID.randomUUID()).title("تست").build();
        RoscaRound round = RoscaRound.builder().id(UUID.randomUUID()).group(group).roundNumber(1).status(RoscaRound.RoundStatus.COLLECTING).build();

        PaymentObligation existing = PaymentObligation.builder()
                .id(obId)
                .round(round)
                .payer(payer)
                .beneficiary(beneficiary)
                .amount(2_000_000L)
                .status(PaymentObligation.ObligationStatus.RECEIPT_SUBMITTED)
                .receiptImageKey("existing.jpg")
                .idempotencyKey(idemKey)
                .build();

        when(obligationRepository.findByIdempotencyKey(idemKey)).thenReturn(Optional.of(existing));

        MockMultipartFile file = new MockMultipartFile("file", "r.jpg", "image/jpeg", new byte[]{1, 2, 3});
        ObligationDto result = obligationService.submitReceipt(obId, payerId, file, "987654", idemKey);

        assertEquals(PaymentObligation.ObligationStatus.RECEIPT_SUBMITTED, result.status());
        verify(localStorageService, never()).storeReceipt(any());
    }
}
