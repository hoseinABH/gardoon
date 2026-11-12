package ir.gardoon.domain.user.controller;

import ir.gardoon.domain.user.dto.AuthResponse;
import ir.gardoon.domain.user.dto.SendOtpRequest;
import ir.gardoon.domain.user.dto.VerifyOtpRequest;
import ir.gardoon.domain.user.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE = "gardoon_refresh";
    private final AuthService authService;

    @PostMapping("/otp/send")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        String devCode = authService.sendOtp(request.phoneNumber());
        if (devCode != null) {
            return ResponseEntity.ok(Map.of("ok", true, "message", "کد تایید ارسال شد", "devCode", devCode));
        }
        return ResponseEntity.ok(Map.of("ok", true, "message", "کد تایید ارسال شد"));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(
        @Valid @RequestBody VerifyOtpRequest request,
        HttpServletResponse response
    ) {
        AuthService.TokenBundle bundle = authService.verifyOtp(request.phoneNumber(), request.code(), request.fullName());
        setRefreshCookie(response, bundle.refreshToken(), Duration.ofDays(7));
        return ResponseEntity.ok(bundle.authResponse());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
        @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
        HttpServletResponse response
    ) {
        AuthService.TokenBundle bundle = authService.refresh(refreshToken);
        setRefreshCookie(response, bundle.refreshToken(), Duration.ofDays(7));
        return ResponseEntity.ok(bundle.authResponse());
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletResponse response) {
        setRefreshCookie(response, "", Duration.ZERO);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private void setRefreshCookie(HttpServletResponse response, String token, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, token)
            .httpOnly(true)
            .sameSite("Lax")
            .path("/api/auth")
            .maxAge(maxAge)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
