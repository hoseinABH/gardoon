package ir.gardoon.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtService(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expiration-ms:900000}") long accessExpirationMs,
        @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs
    ) {
        byte[] keyBytes = secret.length() >= 64
            ? secret.getBytes(StandardCharsets.UTF_8)
            : Decoders.BASE64.decode(secret);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(UUID userId, String phoneNumber) {
        return buildToken(userId, phoneNumber, "access", accessExpirationMs);
    }

    public String generateRefreshToken(UUID userId, String phoneNumber) {
        return buildToken(userId, phoneNumber, "refresh", refreshExpirationMs);
    }

    private String buildToken(UUID userId, String phoneNumber, String type, long ttlMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + ttlMs);
        return Jwts.builder()
            .subject(userId.toString())
            .claim("phone", phoneNumber)
            .claim("type", type)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(signingKey)
            .compact();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public String extractTokenType(String token) {
        return parseClaims(token).get("type", String.class);
    }

    public boolean isValid(String token, String expectedType) {
        try {
            Claims claims = parseClaims(token);
            return expectedType.equals(claims.get("type", String.class))
                && claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
