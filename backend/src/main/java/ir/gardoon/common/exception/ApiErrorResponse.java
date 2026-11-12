package ir.gardoon.common.exception;

import java.time.OffsetDateTime;

public record ApiErrorResponse(
    String code,
    String message,
    int status,
    OffsetDateTime timestamp
) {}
