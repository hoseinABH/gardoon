package ir.gardoon.domain.round.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.common.util.JalaliCalendarUtil;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LuckyDrawService {

    private final RoscaRoundRepository roundRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PaymentObligationRepository obligationRepository;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Executes server-authoritative lucky draw for the specified round.
     * Guardrail 1: Only group owner can trigger draw on an ACTIVE group.
     * Guardrail 2: Pessimistic write lock (SELECT FOR UPDATE) prevents race conditions and duplicate draws.
     * Guardrail 3: Copies immutable banking snapshot to the round.
     */
    @Transactional
    public DrawResultDto executeLuckyDraw(UUID roundId, UUID actorUserId) {
        RoscaRound round = roundRepository.findByIdForUpdate(roundId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND", "دور قرعه‌کشی با شناسه مشخص یافت نشد"));

        RoscaGroup group = round.getGroup();
        if (!group.getOwner().getId().equals(actorUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ONLY_OWNER_CAN_DRAW", "فقط مدیر صندوق مجاز به اجرای قرعه‌کشی است");
        }

        if (group.getStatus() != RoscaGroup.GroupStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "GROUP_NOT_ACTIVE", "صندوق هنوز شروع نشده یا به پایان رسیده است");
        }

        if (round.getStatus() != RoscaRound.RoundStatus.PENDING_DRAW) {
            throw new ApiException(HttpStatus.CONFLICT, "ROUND_ALREADY_DRAWN", "قرعه‌کشی این دور قبلاً انجام شده است");
        }

        UUID groupId = group.getId();
        List<GroupMember> eligibleMembers = groupMemberRepository.findByGroupIdAndStatusAndHasWonPotFalse(
                groupId, GroupMember.MemberStatus.ACTIVE
        );

        if (eligibleMembers.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_ELIGIBLE_MEMBERS", "هیچ عضو واجد شرایطی برای دریافت این وام باقی نمانده است");
        }

        int poolSize = eligibleMembers.size();
        int winnerIndex = SECURE_RANDOM.nextInt(poolSize);
        GroupMember winningMember = eligibleMembers.get(winnerIndex);
        User winner = winningMember.getUser();

        double sliceSize = 360.0 / poolSize;
        int sliceOffset = (int) (winnerIndex * sliceSize + (sliceSize / 2.0));
        int totalRotations = 5;
        int targetAngle = (totalRotations * 360) + sliceOffset;

        String seed = UUID.randomUUID().toString().replace("-", "");
        OffsetDateTime now = OffsetDateTime.now();

        round.setBeneficiary(winner);
        round.setPayoutCardSnapshot(winner.getDefaultCardNumber());
        round.setPayoutIbanSnapshot(winner.getDefaultIban());
        round.setPayoutBankSnapshot(winner.getDefaultBankName());
        round.setPayoutHolderSnapshot(
                winner.getDefaultAccountHolder() != null ? winner.getDefaultAccountHolder() : winner.getFullName()
        );
        round.setDrawSeed(seed);
        round.setDrawTargetAngle(targetAngle);
        round.setDrawCompletedAt(now);
        round.setStatus(RoscaRound.RoundStatus.COLLECTING);
        roundRepository.save(round);

        winningMember.setHasWonPot(true);
        winningMember.setWonRoundNumber(round.getRoundNumber());
        groupMemberRepository.save(winningMember);

        List<GroupMember> allActiveMembers = groupMemberRepository.findByGroupIdAndStatus(
                groupId, GroupMember.MemberStatus.ACTIVE
        );
        List<PaymentObligation> obligations = new ArrayList<>();
        for (GroupMember member : allActiveMembers) {
            if (!member.getUser().getId().equals(winner.getId())) {
                PaymentObligation obligation = PaymentObligation.builder()
                        .round(round)
                        .payer(member.getUser())
                        .beneficiary(winner)
                        .amount(round.getPerMemberShare())
                        .status(PaymentObligation.ObligationStatus.PENDING)
                        .build();
                obligations.add(obligation);
            }
        }
        obligationRepository.saveAll(obligations);

        String roundFa = JalaliCalendarUtil.toPersianDigits(String.valueOf(round.getRoundNumber()));
        chatService.postSystemEvent(
                group,
                "قرعه‌کشی دور " + roundFa + " انجام شد. برنده این دور: " + winner.getFullName()
        );

        DrawResultDto result = new DrawResultDto(
                round.getId(),
                round.getRoundNumber(),
                winner.getId(),
                winner.getFullName(),
                winner.getAvatarUrl(),
                targetAngle,
                winnerIndex,
                seed,
                round.getTotalPotAmount(),
                now
        );

        try {
            messagingTemplate.convertAndSend("/topic/group/" + groupId + "/wheel", result);
        } catch (Exception e) {
            log.warn("Failed to broadcast draw event over WebSocket: {}", e.getMessage());
        }

        return result;
    }
}
