package ir.gardoon.domain.user.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.common.security.JwtService;
import ir.gardoon.domain.user.dto.AuthResponse;
import ir.gardoon.domain.user.dto.UserProfileDto;
import ir.gardoon.domain.user.entity.User;
import ir.gardoon.domain.user.repository.UserRepository;
import ir.gardoon.domain.user.service.sms.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long OTP_TTL_SECONDS = 120;
    private static final long COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final SmsService smsService;

    @Value("${app.auth.dev-mode:true}")
    private boolean devMode;

    private record OtpEntry(String code, Instant expiresAt) {}
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final Map<String, Instant> cooldownStore = new ConcurrentHashMap<>();

    public String sendOtp(String phoneNumber) {
        Instant nextAllowed = cooldownStore.get(phoneNumber);
        if (nextAllowed != null && nextAllowed.isAfter(Instant.now())) {
            long remaining = Duration.between(Instant.now(), nextAllowed).getSeconds() + 1;
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "OTP_COOLDOWN", "لطفاً " + remaining + " ثانیه دیگر دوباره تلاش کنید");
        }

        String code = String.format("%05d", RANDOM.nextInt(100_000));
        otpStore.put(phoneNumber, new OtpEntry(code, Instant.now().plusSeconds(OTP_TTL_SECONDS)));
        cooldownStore.put(phoneNumber, Instant.now().plusSeconds(COOLDOWN_SECONDS));

        log.info("[OTP GENERATED] Phone: {} -> Code: {} (devMode={})", phoneNumber, code, devMode);
        smsService.sendOtp(phoneNumber, code);
        return devMode ? code : null;
    }

    public record TokenBundle(AuthResponse authResponse, String refreshToken) {}

    @Transactional
    public TokenBundle verifyOtp(String phoneNumber, String code, String fullName) {
        OtpEntry entry = otpStore.get(phoneNumber);
        boolean devBypass = devMode && "12345".equals(code);

        if (!devBypass) {
            if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "کد تایید منقضی شده یا ارسال نشده است");
            }
            if (!entry.code().equals(code)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "کد تایید واردشده صحیح نیست");
            }
        }
        otpStore.remove(phoneNumber);

        User user = userRepository.findByPhoneNumber(phoneNumber)
            .orElseGet(() -> createDefaultUser(phoneNumber, fullName));

        if (fullName != null && !fullName.isBlank() && user.getFullName().startsWith("کاربر ")) {
            user.setFullName(fullName.trim());
            user = userRepository.save(user);
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getPhoneNumber());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getPhoneNumber());
        return new TokenBundle(new AuthResponse(accessToken, UserProfileDto.from(user)), refreshToken);
    }

    @Transactional(readOnly = true)
    public TokenBundle refresh(String refreshToken) {
        if (refreshToken == null || !jwtService.isValid(refreshToken, "refresh")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "نشست کاربری منقضی شده است؛ دوباره وارد شوید");
        }
        UUID userId = jwtService.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "کاربر یافت نشد"));

        String newAccess = jwtService.generateAccessToken(user.getId(), user.getPhoneNumber());
        String newRefresh = jwtService.generateRefreshToken(user.getId(), user.getPhoneNumber());
        return new TokenBundle(new AuthResponse(newAccess, UserProfileDto.from(user)), newRefresh);
    }

    private User createDefaultUser(String phoneNumber, String fullName) {
        int hue = 40 + RANDOM.nextInt(280);
        String tail = phoneNumber.substring(phoneNumber.length() - 4);
        String resolvedName = (fullName != null && !fullName.isBlank()) ? fullName.trim() : ("کاربر " + tail);
        User user = User.builder()
            .phoneNumber(phoneNumber)
            .fullName(resolvedName)
            .avatarHue(hue)
            .build();
        return userRepository.save(user);
    }
}
