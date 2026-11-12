package ir.gardoon.domain.group.controller;

import ir.gardoon.common.security.SecurityUtil;
import ir.gardoon.domain.group.dto.*;
import ir.gardoon.domain.group.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public List<GroupSummaryDto> listMyGroups() {
        return groupService.getMyGroups(SecurityUtil.currentUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupDetailDto createGroup(@Valid @RequestBody CreateGroupRequest request) {
        return groupService.createGroup(SecurityUtil.currentUserId(), request);
    }

    @GetMapping("/{id}")
    public GroupDetailDto getGroupDetail(@PathVariable UUID id) {
        return groupService.getGroupDetail(id, SecurityUtil.currentUserId());
    }

    @GetMapping("/invite/{code}")
    public GroupSummaryDto previewByInviteCode(@PathVariable String code) {
        return groupService.getGroupPreviewByInviteCode(code);
    }

    @PostMapping("/join")
    public GroupDetailDto joinGroup(@Valid @RequestBody JoinGroupRequest request) {
        return groupService.joinByInviteCode(SecurityUtil.currentUserId(), request);
    }

    @PostMapping("/{id}/launch")
    public GroupDetailDto launchGroup(@PathVariable UUID id) {
        return groupService.launchGroup(id, SecurityUtil.currentUserId());
    }

    @PostMapping("/{id}/replace-member")
    public GroupDetailDto replaceMember(
            @PathVariable UUID id,
            @Valid @RequestBody ReplaceMemberRequest request
    ) {
        return groupService.replaceMember(id, SecurityUtil.currentUserId(), request);
    }
}
