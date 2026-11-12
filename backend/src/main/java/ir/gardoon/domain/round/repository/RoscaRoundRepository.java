package ir.gardoon.domain.round.repository;

import ir.gardoon.domain.round.entity.RoscaRound;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoscaRoundRepository extends JpaRepository<RoscaRound, UUID> {
    List<RoscaRound> findByGroupIdOrderByCycleNumberAsc(UUID groupId);

    @Query("SELECT r FROM RoscaRound r WHERE r.group.id = :groupId ORDER BY r.cycleNumber ASC")
    List<RoscaRound> findByGroupIdOrderByRoundNumberAsc(@Param("groupId") UUID groupId);

    Optional<RoscaRound> findByGroupIdAndCycleNumber(UUID groupId, Integer cycleNumber);

    @Query("SELECT r FROM RoscaRound r WHERE r.group.id = :groupId AND r.cycleNumber = :roundNumber")
    Optional<RoscaRound> findByGroupIdAndRoundNumber(@Param("groupId") UUID groupId, @Param("roundNumber") Integer roundNumber);

    /**
     * Pessimistic write lock for server-authoritative lucky draw execution.
     * Prevents race conditions and double-spin execution.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RoscaRound r WHERE r.id = :roundId")
    Optional<RoscaRound> findByIdForUpdate(@Param("roundId") UUID roundId);
}
