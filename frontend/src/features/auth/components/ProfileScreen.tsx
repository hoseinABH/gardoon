"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Avatar,
  BankCard,
  Button,
  Icons,
  Shell,
  TextField,
  TopBar,
  Typography,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import { useAuthStore, useHasMounted } from "@/features/auth/store";
import { onlyDigits, toEnDigits, toFaDigits } from "@/lib/format/digits";
import { detectBank, luhnValid, shebaValid } from "@/lib/validation/banking";

export function ProfileScreen() {
  const router = useRouter();
  const mounted = useHasMounted();
  const { user, demoMode, hydrated, updateUser, logout } = useAuthStore();

  const [cardNumber, setCardNumber] = useState("");
  const [iban, setIban] = useState("");
  const [holder, setHolder] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/auth");
      return;
    }
    if (user) {
      setCardNumber(user.defaultCardNumber ?? "");
      setIban(user.defaultIban ?? "");
      setHolder(user.defaultAccountHolder ?? user.fullName);
    }
  }, [hydrated, user, router]);

  if (!mounted || !hydrated || !user) return null;

  const cleanCard = onlyDigits(cardNumber);
  const cleanIban = toEnDigits(iban)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const bankInfo = detectBank(cleanCard, cleanIban);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!luhnValid(cleanCard)) {
      toast.error("شماره کارت ۱۶ رقمی معتبر نیست");
      return;
    }
    if (!shebaValid(cleanIban)) {
      toast.error("شماره شبا ۲۶ کاراکتری معتبر نیست");
      return;
    }
    if (!holder.trim()) {
      toast.error("نام دارنده حساب را وارد کنید");
      return;
    }

    if (demoMode) {
      updateUser({
        ...user,
        defaultCardNumber: cleanCard,
        defaultIban: cleanIban,
        defaultBankName: bankInfo.name,
        defaultAccountHolder: holder.trim(),
        hasBankingDetails: true,
      });
      toast.success("اطلاعات بانکی آزمایشی بروزرسانی شد");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.auth.updateBanking({
        defaultCardNumber: cleanCard,
        defaultIban: cleanIban,
        defaultBankName: bankInfo.name,
        defaultAccountHolder: holder.trim(),
      });
      updateUser(updated);
      toast.success("اطلاعات بانکی ذخیره شد");
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "خطا در ذخیره اطلاعات بانکی";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("از حساب کاربری خارج شدید");
    router.replace("/");
  };

  return (
    <Shell>
      <TopBar title="پروفایل و حساب بانکی" backTo="/home" />

      <main className="flex-1 space-y-5 px-5 py-5 pb-28">
        <div className="flex items-center gap-3.5 rounded-3xl border border-white/8 bg-card p-4">
          <Avatar name={user.fullName} hue={user.avatarHue} size="lg" ring />
          <div className="min-w-0 space-y-1">
            <Typography variant="title-md" className="truncate block">
              {user.fullName}
            </Typography>
            <Typography
              dir="ltr"
              numeric
              variant="body-sm"
              tone="muted"
              className="text-start block"
            >
              {toFaDigits(user.phoneNumber)}
            </Typography>
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
              <Icons.ShieldCheck className="h-3 w-3" />
              <Typography variant="label-sm" tone="primary" className="text-micro">
                {demoMode ? "حساب آزمایشی" : "احراز هویت شده"}
              </Typography>
            </div>
          </div>
        </div>

        <BankCard
          holder={holder || user.fullName}
          card={cleanCard || user.defaultCardNumber}
          iban={cleanIban || user.defaultIban}
          bank={
            cleanCard.length >= 6 || cleanIban.length >= 7
              ? bankInfo.name
              : user.defaultBankName
          }
        />

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <TextField
            label="شماره کارت پیش‌فرض دریافت وام"
            inputMode="numeric"
            maxLength={16}
            ltr
            numericNormalize
            value={cleanCard}
            onChange={(e) => setCardNumber(onlyDigits(e.target.value))}
            onClear={() => setCardNumber("")}
            suffix={cleanCard.length >= 6 ? bankInfo.name : undefined}
            error={
              cleanCard.length === 16 && !luhnValid(cleanCard)
                ? "رقم کنترل کارت نامعتبر است"
                : undefined
            }
          />

          <TextField
            label="شماره شبا پیش‌فرض (IR...)"
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
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            onClear={() => setHolder("")}
          />

          <Button
            type="submit"
            variant="sun"
            loading={saving}
            block
            leading={<Icons.Save className="h-4 w-4" />}
          >
            ذخیره مشخصات بانکی
          </Button>
        </form>

        <Button
          variant="danger"
          size="md"
          block
          leading={<Icons.LogOut className="h-4 w-4" />}
          onClick={handleLogout}
        >
          خروج از حساب کاربری
        </Button>
      </main>
    </Shell>
  );
}
