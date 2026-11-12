package ir.gardoon.domain.round.service;

import ir.gardoon.domain.group.entity.GroupMember;
import ir.gardoon.domain.group.repository.GroupMemberRepository;
import ir.gardoon.domain.obligation.entity.PaymentObligation;
import ir.gardoon.domain.obligation.repository.PaymentObligationRepository;
import ir.gardoon.domain.round.dto.DrawResultDto;
import ir.gardoon.domain.round.entity.RoscaRound;
import ir.gardoon.domain.round.repository.RoscaRoundRepository;
import ir.gardoon.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final SimpMessagingTemplate messagingTemplate;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Executes server-authoritative lucky draw for the specified round.
     * Guardrail 1: Pessimistic write lock (SELECT FOR UPDATE) prevents race conditions and double-spins.
     * Guardrail 2: Copies immutable banking snapshot to the round.
     */
    @Transactional
    public DrawResultDto executeLuckyDraw(UUID roundId) {
        RoscaRound round = roundRepository.findByIdForUpdate(roundId)
                .orElseThrow(() -> new IllegalArgumentException("دور قرعه‌کشی با شناسه مشخص یافت نشد"));

        if (round.getStatus() != RoscaRound.RoundStatus.PENDING_DRAW) {
            throw new IllegalStateException("قرعه‌کشی این دور قبلاً انجام شده یا در وضعیت مجاز نمی‌باشد");
        }

        UUID groupId = round.getGroup().getId();
        List<GroupMember> eligibleMembers = groupMemberRepository.findByGroupIdAndStatusAndHasWonPotFalse(
                groupId, GroupMember.MemberStatus.ACTIVE
        );

        if (eligibleMembers.isEmpty()) {
            throw new IllegalStateException("هیچ عضو واجد شرایطی برای دریافت این وام باقی نمانده است");
        }

        // Server-authoritative random selection using cryptographic SecureRandom
        int poolSize = eligibleMembers.size();
        int winnerIndex = SECURE_RANDOM.nextInt(poolSize);
        GroupMember winningMember = eligibleMembers.get(winnerIndex);
        User winner = winningMember.getUser();

        // Calculate slice angles for the wheel UI
        // Rotates at least 5 full 360-degree cycles + exact slice offset
        double sliceSize = 360.0 / poolSize;
        int sliceOffset = (int) (winnerIndex * sliceSize + (sliceSize / 2.0));
        int totalRotations = 5;
        int targetAngle = (totalRotations * 360) + sliceOffset;

        String seed = UUID.randomUUID().toString().replace("-", "");
        OffsetDateTime now = OffsetDateTime.now();

        // Snapshot recipient banking coordinates
        round.setBeneficiary(winner);
        round.setPayoutCardSnapshot(winner.getDefaultCardNumber());
        round.setPayoutIbanSnapshot(winner.getDefaultIban());
        round.setPayoutBankSnapshot(winner.getDefaultBankName());
        round.setPayoutHolderSnapshot(winner.getDefaultAccountHolder());
        round.setDrawSeed(seed);
        round.setDrawTargetAngle(targetAngle);
        round.setDrawCompletedAt(now);
        round.setStatus(RoscaRound.RoundStatus.COLLECTING);
        roundRepository.save(round);

        // Mark member as having won the pot
        winningMember.setHasWonPot(true);
        winningMember.setWonRoundNumber(round.getRoundNumber());
        groupMemberRepository.save(winningMember);

        // Generate N - 1 payment obligations (everyone owes the winner except the winner themselves)
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

        // Broadcast synchronized real-time draw event via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/group/" + groupId + "/wheel", result);
        } catch (Exception e) {
            log.warn("Failed to broadcast draw event over WebSocket: {}", e.getMessage());
        }

        return result;
    }
}
