package ir.gardoon.domain.user.service.sms;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import ir.gardoon.common.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
public class SmsIrService implements SmsService {

    private final RestClient restClient;
    private final String apiKey;
    private final int templateId;
    private final String paramName;
    private final Long lineNumber;
    private final boolean devMode;

    public record VerifyRequest(
        String mobile,
        int templateId,
        List<Parameter> parameters
    ) {
        public record Parameter(String name, String value) {}
    }

    public record BulkSendRequest(
        Long lineNumber,
        String messageText,
        List<String> mobiles
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SmsIrResponse(
        Integer status,
        String message,
        Map<String, Object> data
    ) {}

    public SmsIrService(String baseUrl, String apiKey, int templateId, String paramName, Long lineNumber, boolean devMode) {
        this.apiKey = apiKey;
        this.templateId = templateId;
        this.paramName = (paramName != null && !paramName.isBlank()) ? paramName : "Code";
        this.lineNumber = (lineNumber != null && lineNumber > 0) ? lineNumber : 500035227752235L;
        this.devMode = devMode;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(4).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(6).toMillis());

        this.restClient = RestClient.builder()
            .requestFactory(factory)
            .baseUrl(baseUrl != null ? baseUrl : "https://api.sms.ir/v1")
            .build();
    }

    @Override
    public void sendOtp(String phoneNumber, String code) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[SMS.IR] API key is blank; skipping real SMS dispatch to {}", phoneNumber);
            return;
        }

        try {
            SmsIrResponse response;
            if (templateId > 0) {
                VerifyRequest request = new VerifyRequest(
                    phoneNumber,
                    templateId,
                    List.of(new VerifyRequest.Parameter(paramName, code))
                );
                log.info("[SMS.IR] Dispatching OTP via templateId={} to {}", templateId, phoneNumber);
                response = restClient.post()
                    .uri("/send/verify")
                    .header("x-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(SmsIrResponse.class);
            } else {
                BulkSendRequest request = new BulkSendRequest(
                    lineNumber,
                    "گردون\nکد تایید ورود شما: " + code,
                    List.of(phoneNumber)
                );
                log.info("[SMS.IR] Dispatching OTP via lineNumber={} to {}", lineNumber, phoneNumber);
                response = restClient.post()
                    .uri("/send/bulk")
                    .header("x-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(SmsIrResponse.class);
            }

            if (response != null && response.status() != null && response.status() == 1) {
                log.info("[SMS.IR SUCCESS] Sent OTP to {}. Provider message: {}", phoneNumber, response.message());
            } else {
                String errMsg = response != null ? response.message() : "Unknown response from sms.ir";
                log.warn("[SMS.IR WARN] Provider returned non-success for {}: {}", phoneNumber, errMsg);
                if (!devMode) {
                    throw new ApiException(HttpStatus.BAD_GATEWAY, "SMS_PROVIDER_ERROR", "خطا در ارسال پیامک توسط سرویس‌دهنده: " + errMsg);
                }
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("[SMS.IR ERROR] Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
            if (!devMode) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "SMS_NETWORK_ERROR", "امکان برقراری ارتباط با سامانه پیامکی وجود ندارد");
            }
        }
    }
}
