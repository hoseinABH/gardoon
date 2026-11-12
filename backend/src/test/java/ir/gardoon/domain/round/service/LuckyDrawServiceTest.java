package ir.gardoon.domain.round.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.domain.chat.service.ChatService;
import ir.gardoon.domain.group.entity.GroupMember;
import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.group.repository.GroupMemberRepository;
import ir.gardoon.domain.obligation.entity.PaymentObligation;
import ir.gardoon.domain.obligation.repository.PaymentObligationRepository;
import ir.gardoon.domain.round.dto.DrawResultDto;
import ir.gardoon.domain.round.entity.RoscaRound;
import ir.gardoon.domain.round.repository.RoscaRoundRepository;
import ir.gardoon.domain.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LuckyDrawServiceTest {

    @Mock private RoscaRoundRepository roundRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private PaymentObligationRepository obligationRepository;
    @Mock private ChatService chatService;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks private LuckyDrawService luckyDrawService;

    @Test
    void executesDrawExclusivelyAmongNonWinnersAndCreatesNMinusOneObligations() {
        UUID ownerId = UUID.randomUUID();
        UUID winnerId = UUID.randomUUID();
        UUID payerTwoId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();

        User owner = User.builder().id(ownerId).fullName("مدیر صندوق").build();
        User eligible = User.builder()
                .id(winnerId)
                .fullName("نیما فرهادی")
                .defaultCardNumber("6037991234567893")
                .defaultIban("IR820540102680020817909002")
                .defaultBankName("بانک ملی ایران")
                .defaultAccountHolder("نیما فرهادی")
                .build();
        User payerTwo = User.builder().id(payerTwoId).fullName("زهرا علوی").build();

        RoscaGroup group = RoscaGroup.builder()
                .id(groupId)
                .owner(owner)
                .status(RoscaGroup.GroupStatus.ACTIVE)
                .build();

        RoscaRound round = RoscaRound.builder()
                .id(roundId)
                .group(group)
                .roundNumber(2)
                .dueDate(LocalDate.now())
                .jalaliDueDateLabel("۱۴۰۴/۰۲/۱۵")
                .totalPotAmount(10_000_000L)
                .perMemberShare(5_000_000L)
                .status(RoscaRound.RoundStatus.PENDING_DRAW)
                .build();

        GroupMember ownerMember = GroupMember.builder().group(group).user(owner).hasWonPot(true).build();
        GroupMember eligibleMember = GroupMember.builder().group(group).user(eligible).hasWonPot(false).build();
        GroupMember payerTwoMember = GroupMember.builder().group(group).user(payerTwo).hasWonPot(true).build();

        when(roundRepository.findByIdForUpdate(roundId)).thenReturn(Optional.of(round));
        when(groupMemberRepository.findByGroupIdAndStatusAndHasWonPotFalse(groupId, GroupMember.MemberStatus.ACTIVE))
                .thenReturn(List.of(eligibleMember));
        when(groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMember.MemberStatus.ACTIVE))
                .thenReturn(List.of(ownerMember, eligibleMember, payerTwoMember));

        DrawResultDto result = luckyDrawService.executeLuckyDraw(roundId, ownerId);

        assertEquals(winnerId, result.winnerUserId());
        assertEquals(RoscaRound.RoundStatus.COLLECTING, round.getStatus());
        assertEquals("6037991234567893", round.getPayoutCardSnapshot());
        assertTrue(eligibleMember.getHasWonPot());
        assertEquals(2, eligibleMember.getWonRoundNumber());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PaymentObligation>> obsCaptor = ArgumentCaptor.forClass(List.class);
        verify(obligationRepository).saveAll(obsCaptor.capture());
        List<PaymentObligation> obligations = obsCaptor.getValue();
        assertEquals(2, obligations.size()); // 3 members -> 2 payers
        assertTrue(obligations.stream().noneMatch(o -> o.getPayer().getId().equals(winnerId)));
        assertTrue(obligations.stream().allMatch(o -> o.getBeneficiary().getId().equals(winnerId)));
    }

    @Test
    void forbidsNonOwnerFromExecutingDraw() {
        UUID ownerId = UUID.randomUUID();
        UUID strangerId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();

        User owner = User.builder().id(ownerId).build();
        RoscaGroup group = RoscaGroup.builder().id(UUID.randomUUID()).owner(owner).status(RoscaGroup.GroupStatus.ACTIVE).build();
        RoscaRound round = RoscaRound.builder().id(roundId).group(group).status(RoscaRound.RoundStatus.PENDING_DRAW).build();

        when(roundRepository.findByIdForUpdate(roundId)).thenReturn(Optional.of(round));

        ApiException ex = assertThrows(ApiException.class, () -> luckyDrawService.executeLuckyDraw(roundId, strangerId));
        assertEquals("ONLY_OWNER_CAN_DRAW", ex.getCode());
    }
}
