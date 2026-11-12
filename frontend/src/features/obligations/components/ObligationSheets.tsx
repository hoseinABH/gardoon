"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Button,
  Icons,
  Sheet,
  TextField,
  Typography,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import type { Obligation } from "@/lib/api/types";
import { enqueueReceiptUpload } from "@/lib/api/offlineQueue";
import { compressReceiptImage } from "@/lib/image/compress";
import { onlyDigits, toFaDigits } from "@/lib/format/digits";
import { formatToman } from "@/lib/format/money";
import { ReceiptImagePreview } from "./ReceiptImagePreview";

export function UploadReceiptSheet({
  obligation,
  demoMode,
  onClose,
  onDemoSubmit,
  onSuccess,
}: {
  obligation: Obligation | null;
  demoMode: boolean;
  onClose: () => void;
  onDemoSubmit: (
    obligation: Obligation,
    tracking: string,
    previewUrl: string
  ) => void;
  onSuccess: () => Promise<void> | void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tracking, setTracking] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    try {
      const compressed = await compressReceiptImage(selected);
      setFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      toast.error("تصویر انتخاب‌شده معتبر نیست");
    }
  };

  const resetAndClose = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setTracking("");
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!obligation) return;

    if (demoMode) {
      onDemoSubmit(obligation, tracking, previewUrl ?? "");
      toast.success("رسید واریز در حالت آزمایشی ثبت شد");
      resetAndClose();
      return;
    }

    if (!file) {
      toast.error("لطفاً تصویر رسید کارت‌به‌کارت را انتخاب کنید");
      return;
    }

    const idempotencyKey = crypto.randomUUID();
    setSubmitting(true);

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueReceiptUpload(obligation.id, file, tracking, idempotencyKey);
        toast.info("اتصال برقرار نیست؛ رسید در صف ارسال خودکار ذخیره شد");
        resetAndClose();
        return;
      }

      await api.obligations.submitReceipt(
        obligation.id,
        file,
        tracking,
        idempotencyKey
      );
      toast.success("رسید واریز با موفقیت ثبت و به برنده اعلام شد");
      await onSuccess();
      resetAndClose();
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "ارسال رسید با خطا مواجه شد";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      open={Boolean(obligation)}
      onClose={resetAndClose}
      title="ثبت رسید واریز قسط"
    >
      {obligation && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-elevated p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <Typography variant="label-sm" tone="muted">
                واریز به:
              </Typography>
              <Typography variant="label-md">
                {obligation.beneficiaryName}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="label-sm" tone="muted">
                مبلغ قسط:
              </Typography>
              <Typography variant="title-sm" tone="primary" numeric>
                {formatToman(obligation.amount)}
              </Typography>
            </div>
          </div>

          {obligation.rejectionReason && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3">
              <Typography variant="body-sm" tone="danger">
                دلیل رد قبلی: {obligation.rejectionReason}
              </Typography>
            </div>
          )}

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-center hover:bg-primary/10 transition">
            <input
              type="file"
              accept="image/*"
              aria-label="انتخاب تصویر رسید بانکی"
              className="hidden"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="پیش‌نمایش رسید"
                width={400}
                height={260}
                className="max-h-52 w-auto rounded-xl object-contain"
              />
            ) : (
              <>
                <Icons.ImagePlus className="h-7 w-7 text-primary" />
                <Typography variant="label-md">
                  انتخاب تصویر رسید بانکی
                </Typography>
                <Typography variant="label-sm" tone="muted">
                  به‌صورت خودکار فشرده‌سازی می‌شود (JPG / PNG / WebP)
                </Typography>
              </>
            )}
          </label>

          <TextField
            label="شماره پیگیری / مرجع (اختیاری)"
            inputMode="numeric"
            ltr
            numericNormalize
            value={tracking}
            onChange={(e) => setTracking(onlyDigits(e.target.value))}
            onClear={() => setTracking("")}
          />

          <Button type="submit" variant="sun" loading={submitting} block>
            ارسال رسید واریز
          </Button>
        </form>
      )}
    </Sheet>
  );
}

export function ReviewObligationSheet({
  obligation,
  canReview,
  demoMode,
  onClose,
  onDemoConfirm,
  onDemoReject,
  onSuccess,
}: {
  obligation: Obligation | null;
  canReview: boolean;
  demoMode: boolean;
  onClose: () => void;
  onDemoConfirm: (obligation: Obligation) => void;
  onDemoReject: (obligation: Obligation, reason: string) => void;
  onSuccess: () => Promise<void> | void;
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const resetAndClose = () => {
    setRejectMode(false);
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!obligation) return;
    if (demoMode) {
      onDemoConfirm(obligation);
      toast.success("واریز قسط تایید شد");
      resetAndClose();
      return;
    }
    setLoading(true);
    try {
      await api.obligations.confirm(obligation.id);
      toast.success("واریز با موفقیت تایید شد");
      await onSuccess();
      resetAndClose();
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "خطا در تایید واریز";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!obligation) return;
    if (reason.trim().length < 3) {
      toast.error("دلیل رد رسید را وارد کنید (حداقل ۳ حرف)");
      return;
    }
    if (demoMode) {
      onDemoReject(obligation, reason.trim());
      toast.info("رسید رد شد");
      resetAndClose();
      return;
    }
    setLoading(true);
    try {
      await api.obligations.reject(obligation.id, reason.trim());
      toast.info("رسید رد شد و به پرداخت‌کننده اطلاع داده شد");
      await onSuccess();
      resetAndClose();
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "خطا در رد رسید";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={Boolean(obligation)}
      onClose={resetAndClose}
      title="بررسی رسید واریز"
    >
      {obligation && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-elevated p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <Typography variant="label-sm" tone="muted">
                پرداخت‌کننده:
              </Typography>
              <Typography variant="label-md">{obligation.payerName}</Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="label-sm" tone="muted">
                مبلغ:
              </Typography>
              <Typography variant="title-sm" tone="primary" numeric>
                {formatToman(obligation.amount)}
              </Typography>
            </div>
            {obligation.trackingReference && (
              <div className="flex items-center justify-between">
                <Typography variant="label-sm" tone="muted">
                  کد پیگیری:
                </Typography>
                <Typography variant="label-md" numeric className="font-mono">
                  {toFaDigits(obligation.trackingReference)}
                </Typography>
              </div>
            )}
          </div>

          <ReceiptImagePreview url={obligation.receiptImageUrl} />

          {canReview && obligation.status === "RECEIPT_SUBMITTED" && (
            <div className="space-y-3 pt-1">
              {rejectMode ? (
                <>
                  <TextField
                    label="دلیل رد رسید"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onClear={() => setReason("")}
                    hint="مثلاً: مبلغ واریزی کامل نیست یا تصویر ناخواناست"
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="danger"
                      size="md"
                      loading={loading}
                      onClick={handleReject}
                    >
                      ثبت رد رسید
                    </Button>
                    <Button
                      variant="tonal"
                      size="md"
                      onClick={() => setRejectMode(false)}
                    >
                      انصراف
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="lime"
                    size="md"
                    loading={loading}
                    leading={<Icons.CheckCircle2 className="h-4 w-4" />}
                    onClick={handleConfirm}
                  >
                    تایید واریز
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    leading={<Icons.XCircle className="h-4 w-4" />}
                    onClick={() => setRejectMode(true)}
                  >
                    رد رسید
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
