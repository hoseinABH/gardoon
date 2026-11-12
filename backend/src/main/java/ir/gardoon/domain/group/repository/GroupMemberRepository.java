package ir.gardoon.domain.group.repository;

import ir.gardoon.domain.group.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {
    List<GroupMember> findByGroupIdAndStatus(UUID groupId, GroupMember.MemberStatus status);
    List<GroupMember> findByGroupIdAndStatusAndHasWonPotFalse(UUID groupId, GroupMember.MemberStatus status);
    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);
    List<GroupMember> findByUserId(UUID userId);
}
