package ir.gardoon.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ApiErrorResponse(
            ex.getCode(),
            ex.getMessage(),
            ex.getStatus().value(),
            OffsetDateTime.now()
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiErrorResponse(
            "BAD_REQUEST",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST.value(),
            OffsetDateTime.now()
        ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiErrorResponse(
            "INVALID_STATE",
            ex.getMessage(),
            HttpStatus.CONFLICT.value(),
            OffsetDateTime.now()
        ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleForbidden(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiErrorResponse(
            "FORBIDDEN",
            "شما دسترسی انجام این عملیات را ندارید",
            HttpStatus.FORBIDDEN.value(),
            OffsetDateTime.now()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(FieldError::getDefaultMessage)
            .orElse("اطلاعات ارسالی معتبر نیست");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiErrorResponse(
            "VALIDATION_ERROR",
            msg,
            HttpStatus.BAD_REQUEST.value(),
            OffsetDateTime.now()
        ));
    }
}
