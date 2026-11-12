package ir.gardoon.domain.group.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.domain.chat.service.ChatService;
import ir.gardoon.domain.group.dto.GroupDetailDto;
import ir.gardoon.domain.group.entity.GroupMember;
import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.group.repository.GroupMemberRepository;
import ir.gardoon.domain.group.repository.RoscaGroupRepository;
import ir.gardoon.domain.obligation.repository.PaymentObligationRepository;
import ir.gardoon.domain.round.entity.RoscaRound;
import ir.gardoon.domain.round.repository.RoscaRoundRepository;
import ir.gardoon.domain.user.entity.User;
import ir.gardoon.domain.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock private RoscaGroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private RoscaRoundRepository roundRepository;
    @Mock private PaymentObligationRepository obligationRepository;
    @Mock private UserService userService;
    @Mock private ChatService chatService;

    @InjectMocks private GroupService groupService;

    @Test
    void launchGroupCalculatesTargetPotSharesAndGeneratesNRounds() {
        UUID ownerId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        User owner = User.builder().id(ownerId).fullName("رضا کریمی").phoneNumber("09121111111").build();
        User m2 = User.builder().id(UUID.randomUUID()).fullName("سارا احمدی").phoneNumber("09122222222").build();
        User m3 = User.builder().id(UUID.randomUUID()).fullName("امیر حسینی").phoneNumber("09123333333").build();
        User m4 = User.builder().id(UUID.randomUUID()).fullName("مینا راد").phoneNumber("09124444444").build();

        RoscaGroup group = RoscaGroup.builder()
                .id(groupId)
                .owner(owner)
                .title("صندوق خانواده")
                .calculationMode(RoscaGroup.CalculationMode.TARGET_POT)
                .baseAmount(12_000_000L)
                .cycleInterval(RoscaGroup.CycleInterval.MONTHLY)
                .jalaliDueDay(15)
                .startDate(LocalDate.of(2025, 4, 1))
                .status(RoscaGroup.GroupStatus.RECRUITING)
                .inviteCode("GRD-FAM123")
                .build();

        List<GroupMember> members = List.of(
                GroupMember.builder().group(group).user(owner).role(GroupMember.MemberRole.OWNER).status(GroupMember.MemberStatus.ACTIVE).build(),
                GroupMember.builder().group(group).user(m2).role(GroupMember.MemberRole.MEMBER).status(GroupMember.MemberStatus.ACTIVE).build(),
                GroupMember.builder().group(group).user(m3).role(GroupMember.MemberRole.MEMBER).status(GroupMember.MemberStatus.ACTIVE).build(),
                GroupMember.builder().group(group).user(m4).role(GroupMember.MemberRole.MEMBER).status(GroupMember.MemberStatus.ACTIVE).build()
        );

        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMember.MemberStatus.ACTIVE)).thenReturn(members);
        when(groupMemberRepository.findByGroupIdAndUserId(groupId, ownerId)).thenReturn(Optional.of(members.get(0)));
        when(roundRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(roundRepository.findByGroupIdOrderByRoundNumberAsc(groupId)).thenReturn(List.of());

        GroupDetailDto detail = groupService.launchGroup(groupId, ownerId);

        assertEquals(RoscaGroup.GroupStatus.ACTIVE, detail.status());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RoscaRound>> roundsCaptor = ArgumentCaptor.forClass(List.class);
        verify(roundRepository).saveAll(roundsCaptor.capture());
        List<RoscaRound> generated = roundsCaptor.getValue();

        assertEquals(4, generated.size());
        // 4 members => 3 contributors * 4,000,000 = 12,000,000 pot
        assertEquals(4_000_000L, generated.get(0).getPerMemberShare());
        assertEquals(12_000_000L, generated.get(0).getTotalPotAmount());
        assertEquals(RoscaRound.RoundStatus.PENDING_DRAW, generated.get(0).getStatus());
        verify(chatService).postSystemEvent(any(RoscaGroup.class), contains("۴ عضو"));
    }

    @Test
    void launchGroupRequiresMinimumTwoMembers() {
        UUID ownerId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        User owner = User.builder().id(ownerId).fullName("رضا").build();
        RoscaGroup group = RoscaGroup.builder()
                .id(groupId)
                .owner(owner)
                .status(RoscaGroup.GroupStatus.RECRUITING)
                .build();

        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMember.MemberStatus.ACTIVE))
                .thenReturn(List.of(GroupMember.builder().group(group).user(owner).status(GroupMember.MemberStatus.ACTIVE).build()));

        ApiException ex = assertThrows(ApiException.class, () -> groupService.launchGroup(groupId, ownerId));
        assertEquals("MIN_TWO_MEMBERS_REQUIRED", ex.getCode());
    }
}
