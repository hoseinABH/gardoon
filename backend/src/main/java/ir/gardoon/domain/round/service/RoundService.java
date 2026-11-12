package ir.gardoon.domain.round.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.domain.group.entity.GroupMember;
import ir.gardoon.domain.group.repository.GroupMemberRepository;
import ir.gardoon.domain.round.dto.RoundDto;
import ir.gardoon.domain.round.entity.RoscaRound;
import ir.gardoon.domain.round.repository.RoscaRoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoscaRoundRepository roundRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional(readOnly = true)
    public List<RoundDto> getRoundsForGroup(UUID groupId, UUID currentUserId) {
        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUserId)
                .filter(m -> m.getStatus() != GroupMember.MemberStatus.REMOVED)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "NOT_A_MEMBER", "شما عضو این صندوق نیستید"));

        return roundRepository.findByGroupIdOrderByRoundNumberAsc(membership.getGroup().getId())
                .stream()
                .map(RoundService::toDto)
                .toList();
    }

    public static RoundDto toDto(RoscaRound round) {
        return new RoundDto(
                round.getId(),
                round.getGroup().getId(),
                round.getRoundNumber(),
                round.getDueDate(),
                round.getJalaliDueDateLabel(),
                round.getBeneficiary() != null ? round.getBeneficiary().getId() : null,
                round.getBeneficiary() != null ? round.getBeneficiary().getFullName() : null,
                round.getBeneficiary() != null ? round.getBeneficiary().getAvatarUrl() : null,
                round.getPayoutCardSnapshot(),
                round.getPayoutIbanSnapshot(),
                round.getPayoutBankSnapshot(),
                round.getPayoutHolderSnapshot(),
                round.getTotalPotAmount(),
                round.getPerMemberShare(),
                round.getDrawTargetAngle(),
                round.getDrawCompletedAt(),
                round.getStatus()
        );
    }
}
