package ir.gardoon.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "phone_number", unique = true, nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "avatar_hue", nullable = false)
    @Builder.Default
    private Integer avatarHue = 160;

    @Column(name = "default_card_number", length = 16)
    private String defaultCardNumber;

    @Column(name = "default_iban", length = 26)
    private String defaultIban;

    @Column(name = "default_bank_name", length = 64)
    private String defaultBankName;

    @Column(name = "default_account_holder", length = 120)
    private String defaultAccountHolder;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
