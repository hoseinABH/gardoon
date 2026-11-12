package ir.gardoon.domain.obligation.controller;

import ir.gardoon.common.security.SecurityUtil;
import ir.gardoon.domain.obligation.dto.ObligationDto;
import ir.gardoon.domain.obligation.dto.RejectObligationRequest;
import ir.gardoon.domain.obligation.service.ObligationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ObligationController {

    private final ObligationService obligationService;

    @GetMapping({"/rounds/{roundId}/obligations", "/cycles/{roundId}/obligations"})
    public List<ObligationDto> getRoundObligations(@PathVariable UUID roundId) {
        return obligationService.getObligationsForRound(roundId, SecurityUtil.currentUserId());
    }

    @PostMapping(value = "/obligations/{id}/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ObligationDto submitReceipt(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "trackingReference", required = false) String trackingReference,
            @RequestHeader(value = "Idempotency-Key", required = false) UUID idempotencyKey
    ) {
        return obligationService.submitReceipt(
                id,
                SecurityUtil.currentUserId(),
                file,
                trackingReference,
                idempotencyKey
        );
    }

    @GetMapping("/obligations/{id}/receipt-image")
    public ResponseEntity<Resource> getReceiptImage(@PathVariable UUID id) {
        ObligationService.ReceiptImagePayload payload = obligationService.loadReceiptImage(id, SecurityUtil.currentUserId());
        return ResponseEntity.ok()
                .contentType(payload.mediaType())
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePrivate())
                .body(payload.resource());
    }

    @PostMapping("/obligations/{id}/confirm")
    public ObligationDto confirmObligation(@PathVariable UUID id) {
        return obligationService.confirmObligation(id, SecurityUtil.currentUserId());
    }

    @PostMapping("/obligations/{id}/reject")
    public ObligationDto rejectObligation(
            @PathVariable UUID id,
            @Valid @RequestBody RejectObligationRequest request
    ) {
        return obligationService.rejectObligation(id, SecurityUtil.currentUserId(), request.reason());
    }
}
