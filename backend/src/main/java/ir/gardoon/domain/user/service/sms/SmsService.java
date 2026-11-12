package ir.gardoon.domain.user.service.sms;

public interface SmsService {
    void sendOtp(String phoneNumber, String code);
}
