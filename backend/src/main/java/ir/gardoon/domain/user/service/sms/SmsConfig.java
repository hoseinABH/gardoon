package ir.gardoon.domain.user.service.sms;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SmsConfig {

    @Value("${app.sms.provider:sms-ir}")
    private String provider;

    @Value("${app.sms.base-url:https://api.sms.ir/v1}")
    private String baseUrl;

    @Value("${app.sms.api-key:}")
    private String apiKey;

    @Value("${app.sms.template-id:0}")
    private int templateId;

    @Value("${app.sms.param-name:Code}")
    private String paramName;

    @Value("${app.sms.line-number:500035227752235}")
    private Long lineNumber;

    @Value("${app.auth.dev-mode:true}")
    private boolean devMode;

    @Bean
    public SmsService smsService() {
        if ("sms-ir".equalsIgnoreCase(provider) || "sms.ir".equalsIgnoreCase(provider)) {
            return new SmsIrService(baseUrl, apiKey, templateId, paramName, lineNumber, devMode);
        }
        return new MockSmsService();
    }
}
