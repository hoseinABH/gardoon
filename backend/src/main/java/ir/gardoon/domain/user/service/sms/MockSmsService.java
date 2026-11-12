package ir.gardoon.domain.user.service.sms;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MockSmsService implements SmsService {

    @Override
    public void sendOtp(String phoneNumber, String code) {
        log.info("[MOCK SMS] Sent OTP to {} -> Code: {}", phoneNumber, code);
    }
}
