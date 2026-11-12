package ir.gardoon.domain.user.controller;

import ir.gardoon.common.security.SecurityUtil;
import ir.gardoon.domain.user.dto.UpdateBankingRequest;
import ir.gardoon.domain.user.dto.UserProfileDto;
import ir.gardoon.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> me() {
        return ResponseEntity.ok(userService.getProfile(SecurityUtil.currentUserId()));
    }

    @PutMapping("/me/banking")
    public ResponseEntity<UserProfileDto> updateBanking(@Valid @RequestBody UpdateBankingRequest request) {
        return ResponseEntity.ok(userService.updateBanking(SecurityUtil.currentUserId(), request));
    }
}
