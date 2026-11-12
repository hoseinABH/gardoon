package ir.gardoon.domain.round.controller;

import ir.gardoon.common.security.SecurityUtil;
import ir.gardoon.domain.round.dto.DrawResultDto;
import ir.gardoon.domain.round.dto.RoundDto;
import ir.gardoon.domain.round.service.LuckyDrawService;
import ir.gardoon.domain.round.service.RoundService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoundController {

    private final RoundService roundService;
    private final LuckyDrawService luckyDrawService;

    @GetMapping("/groups/{groupId}/rounds")
    public List<RoundDto> getGroupRounds(@PathVariable UUID groupId) {
        return roundService.getRoundsForGroup(groupId, SecurityUtil.currentUserId());
    }

    @PostMapping("/rounds/{roundId}/draw")
    public DrawResultDto executeDraw(@PathVariable UUID roundId) {
        return luckyDrawService.executeLuckyDraw(roundId, SecurityUtil.currentUserId());
    }
}
