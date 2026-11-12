package ir.gardoon.domain.group.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.common.util.JalaliCalendarUtil;
import ir.gardoon.domain.chat.service.ChatService;
import ir.gardoon.domain.group.dto.*;
import ir.gardoon.domain.group.entity.GroupMember;
import ir.gardoon.domain.group.entity.RoscaGroup;
import ir.gardoon.domain.group.repository.GroupMemberRepository;
import ir.gardoon.domain.group.repository.RoscaGroupRepository;
import ir.gardoon.domain.obligation.entity.PaymentObligation;
import ir.gardoon.domain.obligation.repository.PaymentObligationRepository;
import ir.gardoon.domain.round.dto.RoundDto;
import ir.gardoon.domain.round.entity.RoscaRound;
import ir.gardoon.domain.round.repository.RoscaRoundRepository;
import ir.gardoon.domain.round.service.RoundService;
import ir.gardoon.domain.user.entity.User;
import ir.gardoon.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GroupService {

    private static final String INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RoscaGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final RoscaRoundRepository roundRepository;
    private final PaymentObligationRepository obligationRepository;
    private final UserService userService;
    private final ChatService chatService;

    @Transactional
    public GroupDetailDto createGroup(UUID ownerId, CreateGroupRequest request) {
        User owner = userService.getEntity(ownerId);

        RoscaGroup group = RoscaGroup.builder()
                .owner(owner)
                .title(request.title().trim())
                .calculationMode(request.calculationMode())
                .baseAmount(request.baseAmount())
                .currency("IRT")
                .cycleInterval(request.cycleInterval())
                .jalaliDueDay(request.jalaliDueDay())
                .startDate(request.startDate() != null ? request.startDate() : LocalDate.now())
                .gracePeriodHours(request.gracePeriodHours() != null ? request.gracePeriodHours() : 48)
                .status(RoscaGroup.GroupStatus.RECRUITING)
                .inviteCode(generateUniqueInviteCode())
                .build();

        group = groupRepository.save(group);

        GroupMember ownerMembership = GroupMember.builder()
                .group(group)
                .user(owner)
                .role(GroupMember.MemberRole.OWNER)
                .status(GroupMember.MemberStatus.ACTIVE)
                .hasWonPot(false)
                .build();
        groupMemberRepository.save(ownerMembership);

        chatService.postSystemEvent(group, "صندوق «" + group.getTitle() + "» توسط " + owner.getFullName() + " ایجاد شد.");
        return getGroupDetail(group.getId(), ownerId);
    }

    @Transactional(readOnly = true)
    public List<GroupSummaryDto> getMyGroups(UUID currentUserId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserId(currentUserId);
        List<GroupSummaryDto> summaries = new ArrayList<>();
        for (GroupMember membership : memberships) {
            if (membership.getStatus() == GroupMember.MemberStatus.REMOVED) {
                continue;
            }
            summaries.add(toSummaryDto(membership.getGroup()));
        }
        summaries.sort(Comparator.comparing(GroupSummaryDto::createdAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return summaries;
    }

    @Transactional(readOnly = true)
    public GroupDetailDto getGroupDetail(UUID groupId, UUID currentUserId) {
        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUserId)
                .filter(m -> m.getStatus() != GroupMember.MemberStatus.REMOVED)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "NOT_A_MEMBER", "شما عضو این صندوق نیستید"));

        RoscaGroup group = membership.getGroup();
        List<GroupMember> activeMembers = groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMember.MemberStatus.ACTIVE);
        List<RoscaRound> rounds = roundRepository.findByGroupIdOrderByRoundNumberAsc(groupId);

        PotNumbers pot = computePotNumbers(group, activeMembers.size(), rounds);

        List<GroupMemberDto> memberDtos = activeMembers.stream()
                .sorted(Comparator.comparing(GroupMember::getJoinedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(GroupService::toMemberDto)
                .toList();

        List<RoundDto> roundDtos = rounds.stream()
                .map(RoundService::toDto)
                .toList();

        return new GroupDetailDto(
                group.getId(),
                group.getTitle(),
                group.getOwner().getId(),
                group.getOwner().getFullName(),
                group.getCalculationMode(),
                group.getBaseAmount(),
                pot.totalPotAmount(),
                pot.perMemberShare(),
                group.getCurrency(),
                group.getCycleInterval(),
                group.getJalaliDueDay(),
                group.getStartDate(),
                group.getGracePeriodHours(),
                group.getStatus(),
                group.getInviteCode(),
                memberDtos,
                roundDtos,
                group.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public GroupSummaryDto getGroupPreviewByInviteCode(String inviteCode) {
        String normalized = normalizeInviteCode(inviteCode);
        RoscaGroup group = groupRepository.findByInviteCode(normalized)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVITE_NOT_FOUND", "صندوقی با این کد دعوت یافت نشد"));
        return toSummaryDto(group);
    }

    @Transactional
    public GroupDetailDto joinByInviteCode(UUID currentUserId, JoinGroupRequest request) {
        String normalized = normalizeInviteCode(request.inviteCode());
        RoscaGroup group = groupRepository.findByInviteCode(normalized)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVITE_NOT_FOUND", "کد دعوت نامعتبر است"));

        User user = userService.getEntity(currentUserId);
        Optional<GroupMember> existingOpt = groupMemberRepository.findByGroupIdAndUserId(group.getId(), currentUserId);

        if (existingOpt.isPresent()) {
            GroupMember existing = existingOpt.get();
            if (existing.getStatus() == GroupMember.MemberStatus.ACTIVE) {
                return getGroupDetail(group.getId(), currentUserId);
            }
            if (group.getStatus() != RoscaGroup.GroupStatus.RECRUITING) {
                throw new ApiException(HttpStatus.CONFLICT, "GROUP_ALREADY_LAUNCHED", "امکان پیوستن پس از شروع صندوق وجود ندارد");
            }
            existing.setStatus(GroupMember.MemberStatus.ACTIVE);
            groupMemberRepository.save(existing);
        } else {
            if (group.getStatus() != RoscaGroup.GroupStatus.RECRUITING) {
                throw new ApiException(HttpStatus.CONFLICT, "GROUP_ALREADY_LAUNCHED", "این صندوق قبلاً آغاز شده و عضوگیری آن بسته شده است");
            }
            GroupMember member = GroupMember.builder()
                    .group(group)
                    .user(user)
                    .role(GroupMember.MemberRole.MEMBER)
                    .status(GroupMember.MemberStatus.ACTIVE)
                    .hasWonPot(false)
                    .build();
            groupMemberRepository.save(member);
        }

        chatService.postSystemEvent(group, user.getFullName() + " به صندوق پیوست.");
        return getGroupDetail(group.getId(), currentUserId);
    }

    @Transactional
    public GroupDetailDto launchGroup(UUID groupId, UUID actorUserId) {
        RoscaGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND", "صندوق یافت نشد"));

        if (!group.getOwner().getId().equals(actorUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ONLY_OWNER_CAN_LAUNCH", "فقط مدیر صندوق مجاز به شروع صندوق است");
        }

        if (group.getStatus() != RoscaGroup.GroupStatus.RECRUITING) {
            throw new ApiException(HttpStatus.CONFLICT, "GROUP_ALREADY_LAUNCHED", "صندوق قبلاً شروع شده است");
        }

        List<GroupMember> activeMembers = groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMember.MemberStatus.ACTIVE);
        int memberCount = activeMembers.size();
        if (memberCount < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MIN_TWO_MEMBERS_REQUIRED", "برای شروع صندوق حداقل ۲ عضو فعال لازم است");
        }

        PotNumbers pot = computePotNumbers(group, memberCount, List.of());
        LocalDate baseStartDate = group.getStartDate() != null ? group.getStartDate() : LocalDate.now();
        boolean isWeekly = group.getCycleInterval() == RoscaGroup.CycleInterval.WEEKLY;

        List<RoscaRound> rounds = new ArrayList<>(memberCount);
        for (int roundNumber = 1; roundNumber <= memberCount; roundNumber++) {
            LocalDate dueDate = JalaliCalendarUtil.computeRoundDueDate(
                    baseStartDate,
                    roundNumber - 1,
                    isWeekly,
                    group.getJalaliDueDay()
            );
            String jalaliLabel = JalaliCalendarUtil.toPersianDigits(
                    JalaliCalendarUtil.toJalali(dueDate).toIsoLabel()
            );

            RoscaRound round = RoscaRound.builder()
                    .group(group)
                    .roundNumber(roundNumber)
                    .dueDate(dueDate)
                    .jalaliDueDateLabel(jalaliLabel)
                    .totalPotAmount(pot.totalPotAmount())
                    .perMemberShare(pot.perMemberShare())
                    .status(RoscaRound.RoundStatus.PENDING_DRAW)
                    .build();
            rounds.add(round);
        }

        roundRepository.saveAll(rounds);
        group.setStatus(RoscaGroup.GroupStatus.ACTIVE);
        groupRepository.save(group);

        String countFa = JalaliCalendarUtil.toPersianDigits(String.valueOf(memberCount));
        chatService.postSystemEvent(
                group,
                "صندوق با " + countFa + " عضو و " + countFa + " دوره به‌صورت رسمی آغاز شد."
        );

        return getGroupDetail(groupId, actorUserId);
    }

    @Transactional
    public GroupDetailDto replaceMember(UUID groupId, UUID actorUserId, ReplaceMemberRequest request) {
        RoscaGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND", "صندوق یافت نشد"));

        if (!group.getOwner().getId().equals(actorUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ONLY_OWNER_CAN_REPLACE", "فقط مدیر صندوق مجاز به جایگزینی عضو است");
        }

        if (request.oldMemberUserId().equals(group.getOwner().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_REPLACE_OWNER", "امکان جایگزینی مدیر صندوق وجود ندارد");
        }

        GroupMember oldMember = groupMemberRepository.findByGroupIdAndUserId(groupId, request.oldMemberUserId())
                .filter(m -> m.getStatus() == GroupMember.MemberStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "عضو مورد نظر در این صندوق فعال نیست"));

        User replacementUser = userService.getEntityByPhoneNumber(request.replacementPhoneNumber().trim());
        if (replacementUser.getId().equals(oldMember.getUser().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_MEMBER", "عضو جایگزین نمی‌تواند با عضو فعلی یکسان باشد");
        }

        Optional<GroupMember> existingReplacementOpt = groupMemberRepository.findByGroupIdAndUserId(groupId, replacementUser.getId());
        if (existingReplacementOpt.isPresent() && existingReplacementOpt.get().getStatus() == GroupMember.MemberStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "REPLACEMENT_ALREADY_MEMBER", "کاربر جایگزین هم‌اکنون عضو این صندوق است");
        }

        oldMember.setStatus(GroupMember.MemberStatus.REMOVED);
        groupMemberRepository.save(oldMember);

        GroupMember newMember = existingReplacementOpt.orElseGet(() -> GroupMember.builder()
                .group(group)
                .user(replacementUser)
                .role(GroupMember.MemberRole.MEMBER)
                .build());
        newMember.setStatus(GroupMember.MemberStatus.ACTIVE);
        newMember.setHasWonPot(oldMember.getHasWonPot());
        newMember.setWonRoundNumber(oldMember.getWonRoundNumber());
        groupMemberRepository.save(newMember);

        // Transfer pending or rejected obligations in active rounds to the replacement member
        List<RoscaRound> rounds = roundRepository.findByGroupIdOrderByRoundNumberAsc(groupId);
        for (RoscaRound round : rounds) {
            if (round.getStatus() == RoscaRound.RoundStatus.COLLECTING) {
                obligationRepository.findByRoundIdAndPayerId(round.getId(), oldMember.getUser().getId())
                        .filter(ob -> ob.getStatus() == PaymentObligation.ObligationStatus.PENDING
                                || ob.getStatus() == PaymentObligation.ObligationStatus.REJECTED)
                        .ifPresent(ob -> {
                            ob.setPayer(replacementUser);
                            obligationRepository.save(ob);
                        });
            }
        }

        chatService.postSystemEvent(
                group,
                oldMember.getUser().getFullName() + " با " + replacementUser.getFullName() + " جایگزین شد."
        );

        return getGroupDetail(groupId, actorUserId);
    }

    private GroupSummaryDto toSummaryDto(RoscaGroup group) {
        List<GroupMember> activeMembers = groupMemberRepository.findByGroupIdAndStatus(group.getId(), GroupMember.MemberStatus.ACTIVE);
        List<RoscaRound> rounds = roundRepository.findByGroupIdOrderByRoundNumberAsc(group.getId());
        PotNumbers pot = computePotNumbers(group, activeMembers.size(), rounds);
        int completedRounds = (int) rounds.stream()
                .filter(r -> r.getStatus() == RoscaRound.RoundStatus.SETTLED)
                .count();

        return new GroupSummaryDto(
                group.getId(),
                group.getTitle(),
                group.getOwner().getId(),
                group.getOwner().getFullName(),
                group.getCalculationMode(),
                group.getBaseAmount(),
                pot.totalPotAmount(),
                pot.perMemberShare(),
                group.getCurrency(),
                group.getCycleInterval(),
                group.getJalaliDueDay(),
                group.getStartDate(),
                group.getGracePeriodHours(),
                group.getStatus(),
                group.getInviteCode(),
                activeMembers.size(),
                completedRounds,
                rounds.size(),
                group.getCreatedAt()
        );
    }

    private static PotNumbers computePotNumbers(RoscaGroup group, int activeMemberCount, List<RoscaRound> rounds) {
        if (!rounds.isEmpty()) {
            RoscaRound sample = rounds.get(0);
            return new PotNumbers(sample.getTotalPotAmount(), sample.getPerMemberShare());
        }
        int contributors = Math.max(1, activeMemberCount - 1);
        if (group.getCalculationMode() == RoscaGroup.CalculationMode.TARGET_POT) {
            if (activeMemberCount < 2) {
                return new PotNumbers(group.getBaseAmount(), group.getBaseAmount());
            }
            long perShare = group.getBaseAmount() / contributors;
            long totalPot = perShare * contributors;
            return new PotNumbers(totalPot, perShare);
        }
        // FIXED_CONTRIBUTION
        long perShare = group.getBaseAmount();
        long totalPot = activeMemberCount < 2 ? group.getBaseAmount() : perShare * contributors;
        return new PotNumbers(totalPot, perShare);
    }

    private static GroupMemberDto toMemberDto(GroupMember member) {
        User user = member.getUser();
        return new GroupMemberDto(
                user.getId(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAvatarUrl(),
                user.getAvatarHue(),
                member.getRole(),
                member.getStatus(),
                member.getHasWonPot(),
                member.getWonRoundNumber(),
                user.getDefaultCardNumber(),
                user.getDefaultIban(),
                user.getDefaultBankName(),
                user.getDefaultAccountHolder(),
                member.getJoinedAt()
        );
    }

    private String normalizeInviteCode(String inviteCode) {
        return inviteCode.trim().toUpperCase(Locale.ROOT);
    }

    private String generateUniqueInviteCode() {
        for (int attempt = 0; attempt < 16; attempt++) {
            StringBuilder sb = new StringBuilder("GRD-");
            for (int i = 0; i < 6; i++) {
                sb.append(INVITE_CHARS.charAt(SECURE_RANDOM.nextInt(INVITE_CHARS.length())));
            }
            String candidate = sb.toString();
            if (groupRepository.findByInviteCode(candidate).isEmpty()) {
                return candidate;
            }
        }
        return "GRD-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
    }

    private record PotNumbers(long totalPotAmount, long perMemberShare) {
    }
}
