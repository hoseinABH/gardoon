"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Button,
  GardoonLogo,
  Icons,
  Shell,
  TextField,
  TopBar,
  Typography,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import { useAuthStore } from "@/features/auth/store";
import { hasSeenOnboarding } from "@/features/onboarding/storage";
import { onlyDigits, toEnDigits, toFaDigits } from "@/lib/format/digits";
import {
  detectBank,
  luhnValid,
  phoneValid,
  shebaValid,
} from "@/lib/validation/banking";

type Step = "PHONE" | "OTP" | "BANKING";

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/home";
  const { setSession, updateUser } = useAuthStore();

  const [step, setStep] = useState<Step>("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [iban, setIban] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [seenOnboarding, setSeenOnboarding] = useState(false);

  useEffect(() => {
    setSeenOnboarding(hasSeenOnboarding());
  }, []);

  const cleanPhone = onlyDigits(phone);
  const cleanCard = onlyDigits(cardNumber);
  const cleanIban = toEnDigits(iban)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const detectedBank = detectBank(cleanCard, cleanIban);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!phoneValid(cleanPhone)) {
      toast.error("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.sendOtp(cleanPhone);
      setDevCode(res.devCode ?? null);
      if (res.devCode) {
        setOtp(res.devCode);
      }
      toast.success("کد تایید ارسال شد");
      setStep("OTP");
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "خطا در ارسال کد تایید";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const cleanCode = onlyDigits(otp);
    if (cleanCode.length < 4) {
      toast.error("کد تایید ۵ رقمی را وارد کنید");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.verifyOtp(
        cleanPhone,
        cleanCode,
        fullName.trim() || undefined
      );
      setSession(res.user, res.accessToken, "");
      setAccountHolder(res.user.fullName);
      toast.success(`خوش آمدید، ${res.user.fullName}`);

      if (!res.user.defaultCardNumber || !res.user.defaultIban) {
        setStep("BANKING");
      } else {
        router.replace(nextPath);
      }
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "کد تایید نامعتبر است";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanking = async (e: FormEvent) => {
    e.preventDefault();
    if (!luhnValid(cleanCard)) {
      toast.error("شماره کارت ۱۶ رقمی معتبر نیست");
      return;
    }
    if (!shebaValid(cleanIban)) {
      toast.error("شماره شبا ۲۶ کاراکتری با IR معتبر نیست");
      return;
    }
    if (!accountHolder.trim()) {
      toast.error("نام دارنده حساب را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const updated = await api.auth.updateBanking({
        defaultCardNumber: cleanCard,
        defaultIban: cleanIban,
        defaultBankName: detectedBank.name,
        defaultAccountHolder: accountHolder.trim(),
      });
      updateUser(updated);
      toast.success("اطلاعات بانکی با موفقیت ذخیره شد");
      router.replace(nextPath);
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "خطا در ذخیره اطلاعات بانکی";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell className="bg-background">
      <TopBar
        title={
          step === "PHONE"
            ? "ورود به گردون"
            : step === "OTP"
            ? "تایید شماره موبایل"
            : "ثبت کارت و شماره شبا"
        }
        subtitle="صندوق قرض‌الحسنه هوشمند"
        backTo={step === "PHONE" && !seenOnboarding ? "/" : undefined}
        right={<GardoonLogo size={32} />}
      />

      <div className="flex flex-1 flex-col justify-between px-5 py-6">
        <div className="space-y-6">
          <div className="rounded-3xl bg-hero border border-white/8 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                {step === "BANKING" ? (
                  <Icons.CreditCard className="h-5 w-5" />
                ) : step === "OTP" ? (
                  <Icons.ShieldCheck className="h-5 w-5" />
                ) : (
                  <Icons.Phone className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <Typography variant="title-md">
                  {step === "PHONE" && "شماره همراه خود را وارد کنید"}
                  {step === "OTP" && "کد تایید پیامکی را وارد کنید"}
                  {step === "BANKING" && "مشخصات دریافت وام"}
                </Typography>
                <Typography variant="body-sm" tone="muted">
                  {step === "PHONE" &&
                    "برای ایجاد صندوق یا پیوستن به گروه، حساب شما با شماره موبایل احراز می‌شود."}
                  {step === "OTP" &&
                    `کد ارسال شده به شماره ${toFaDigits(cleanPhone)} را وارد نمایید.`}
                  {step === "BANKING" &&
                    "هنگام برنده شدن در قرعه‌کشی، اعضای گروه سهم خود را به این کارت واریز می‌کنند."}
                </Typography>
              </div>
            </div>
          </div>

          {step === "PHONE" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <TextField
                label="شماره موبایل"
                inputMode="tel"
                maxLength={11}
                ltr
                numericNormalize
                value={cleanPhone}
                onChange={(e) => setPhone(onlyDigits(e.target.value))}
                onClear={() => setPhone("")}
                leading={<Icons.Phone className="h-4 w-4" />}
                hint="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
              />

              <Button
                type="submit"
                variant="sun"
                loading={loading}
                block
                trailing={<Icons.ArrowLeft className="h-4 w-4" />}
              >
                دریافت کد تایید
              </Button>
            </form>
          )}

          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {devCode && (
                <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5">
                  <Typography variant="label-md" tone="primary">
                    کد آزمایشی توسعه:
                  </Typography>
                  <Typography
                    variant="title-sm"
                    numeric
                    className="font-mono tracking-widest"
                  >
                    {toFaDigits(devCode)}
                  </Typography>
                </div>
              )}

              <TextField
                label="کد تایید ۵ رقمی"
                inputMode="numeric"
                maxLength={6}
                ltr
                numericNormalize
                value={otp}
                onChange={(e) => setOtp(onlyDigits(e.target.value))}
                onClear={() => setOtp("")}
              />

              <TextField
                label="نام و نام خانوادگی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onClear={() => setFullName("")}
                hint="برای کاربران جدید نمایش داده می‌شود"
              />

              <div className="flex flex-col gap-2.5 pt-1">
                <Button
                  type="submit"
                  variant="sun"
                  loading={loading}
                  block
                  trailing={<Icons.CheckCircle2 className="h-4 w-4" />}
                >
                  تایید و ورود
                </Button>
                <Button
                  variant="tonal"
                  size="md"
                  block
                  onClick={() => setStep("PHONE")}
                >
                  تغییر شماره موبایل
                </Button>
              </div>
            </form>
          )}

          {step === "BANKING" && (
            <form onSubmit={handleSaveBanking} className="space-y-5">
              <TextField
                label="شماره کارت ۱۶ رقمی"
                inputMode="numeric"
                maxLength={16}
                ltr
                numericNormalize
                value={cleanCard}
                onChange={(e) => setCardNumber(onlyDigits(e.target.value))}
                onClear={() => setCardNumber("")}
                suffix={cleanCard.length >= 6 ? detectedBank.name : undefined}
                error={
                  cleanCard.length === 16 && !luhnValid(cleanCard)
                    ? "رقم کنترل کارت صحیح نیست"
                    : undefined
                }
              />

              <TextField
                label="شماره شبا (۲۶ کاراکتر با IR)"
                maxLength={26}
                ltr
                value={cleanIban}
                onChange={(e) =>
                  setIban(
                    toEnDigits(e.target.value)
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                  )
                }
                onClear={() => setIban("")}
                error={
                  cleanIban.length === 26 && !shebaValid(cleanIban)
                    ? "شماره شبا نامعتبر است"
                    : undefined
                }
              />

              <TextField
                label="نام صاحب حساب"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                onClear={() => setAccountHolder("")}
              />

              <div className="flex flex-col gap-2.5 pt-1">
                <Button type="submit" variant="sun" loading={loading} block>
                  ذخیره و ورود به برنامه
                </Button>
                <Button
                  variant="text"
                  size="md"
                  block
                  onClick={() => router.replace(nextPath)}
                >
                  فعلاً رد می‌شوم (تکمیل از پروفایل)
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Shell>
  );
}
