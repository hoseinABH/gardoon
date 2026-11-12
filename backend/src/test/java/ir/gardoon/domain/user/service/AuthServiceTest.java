package ir.gardoon.domain.user.service;

import ir.gardoon.common.exception.ApiException;
import ir.gardoon.common.security.JwtService;
import ir.gardoon.domain.user.entity.User;
import ir.gardoon.domain.user.repository.UserRepository;
import ir.gardoon.domain.user.service.sms.SmsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private SmsService smsService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, jwtService, smsService);
        ReflectionTestUtils.setField(authService, "devMode", true);
    }

    @Test
    @DisplayName("sendOtp generates code, invokes SmsService, and returns devCode")
    void testSendOtpSuccess() {
        String phone = "09121110001";
        String code = authService.sendOtp(phone);

        assertNotNull(code);
        assertEquals(5, code.length());
        verify(smsService, times(1)).sendOtp(eq(phone), eq(code));
    }

    @Test
    @DisplayName("sendOtp rejects consecutive requests within cooldown window")
    void testSendOtpCooldown() {
        String phone = "09121110002";
        authService.sendOtp(phone);

        ApiException ex = assertThrows(ApiException.class, () -> authService.sendOtp(phone));
        assertEquals("OTP_COOLDOWN", ex.getCode());
        assertTrue(ex.getMessage().contains("ثانیه دیگر"));
    }

    @Test
    @DisplayName("verifyOtp succeeds and issues tokens for valid code")
    void testVerifyOtpSuccess() {
        String phone = "09121110003";
        String code = authService.sendOtp(phone);

        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .phoneNumber(phone)
                .fullName("کاربر تستی")
                .avatarHue(180)
                .build();

        when(userRepository.findByPhoneNumber(phone)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(eq(userId), eq(phone))).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(eq(userId), eq(phone))).thenReturn("mock-refresh-token");

        AuthService.TokenBundle bundle = authService.verifyOtp(phone, code, null);

        assertNotNull(bundle);
        assertEquals("mock-access-token", bundle.authResponse().accessToken());
        assertEquals("mock-refresh-token", bundle.refreshToken());
        assertEquals(userId, bundle.authResponse().user().id());
    }

    @Test
    @DisplayName("verifyOtp throws exception for incorrect code")
    void testVerifyOtpInvalidCode() {
        String phone = "09121110004";
        authService.sendOtp(phone);

        ApiException ex = assertThrows(ApiException.class, () -> authService.verifyOtp(phone, "99999", null));
        assertEquals("OTP_INVALID", ex.getCode());
    }
}
