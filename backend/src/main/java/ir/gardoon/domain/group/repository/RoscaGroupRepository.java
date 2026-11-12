package ir.gardoon.domain.group.repository;

import ir.gardoon.domain.group.entity.RoscaGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoscaGroupRepository extends JpaRepository<RoscaGroup, UUID> {
    Optional<RoscaGroup> findByInviteCode(String inviteCode);
}
