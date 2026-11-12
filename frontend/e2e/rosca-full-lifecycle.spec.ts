import { expect, test } from "@playwright/test";
import {
  createTestPngBuffer,
  makeLuhnCard,
  makeValidSheba,
  randomIranPhone,
  signUpViaUi,
} from "./helpers";

test.describe("Full multi-user ROSCA lifecycle (Live Spring Boot + PostgreSQL)", () => {
  test("creates group, joins via invite, launches, runs draw, rejects/resubmits/confirms receipt & settles round + chat", async ({
    browser,
  }) => {
    const ownerCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "fa-IR",
    });
    const memberCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "fa-IR",
    });

    const ownerPage = await ownerCtx.newPage();
    const memberPage = await memberCtx.newPage();

    try {
      const ownerPhone = randomIranPhone(11);
      const memberPhone = randomIranPhone(29);
      const ownerCard = makeLuhnCard("603799759911122");
      const memberCard = makeLuhnCard("621986104455667");
      const ownerIban = makeValidSheba(`2960000000${ownerPhone.slice(1)}1`);
      const memberIban = makeValidSheba(`2960000000${memberPhone.slice(1)}2`);

      // 1. Owner registers
      await signUpViaUi(ownerPage, {
        phone: ownerPhone,
        fullName: "سارا محمدی",
        card: ownerCard,
        iban: ownerIban,
        startUrl: "/auth",
      });

      // 2. Owner creates new group via /create wizard
      await ownerPage.getByRole("link", { name: "صندوق جدید" }).click();
      await expect(ownerPage).toHaveURL(/\/create$/);
      await expect(ownerPage).toHaveTitle("ایجاد صندوق جدید | گردون");

      const groupTitle = `صندوق آزمایشی ${Date.now().toString().slice(-4)}`;
      await ownerPage.getByRole("textbox", { name: "عنوان صندوق" }).fill(groupTitle);
      await ownerPage.getByRole("tab", { name: /قسط ماهانه ثابت/ }).click();
      await ownerPage
        .getByRole("textbox", { name: "مبلغ قسط هر عضو در هر دوره (تومان)" })
        .fill("5000000");

      await expect(ownerPage.getByText(/معادل پنج میلیون تومان/)).toBeVisible();
      await ownerPage
        .getByRole("button", { name: /ایجاد صندوق و دریافت کد دعوت/ })
        .click();

      await ownerPage.waitForURL(/\/groups\/.+/);
      const groupUrl = ownerPage.url();
      await expect(ownerPage.getByRole("heading", { name: groupTitle })).toBeVisible();

      const inviteCode = (
        await ownerPage.locator("span.font-mono").first().innerText()
      ).trim();
      expect(inviteCode.length).toBeGreaterThanOrEqual(4);

      // 3. Member previews invite page and registers + joins
      await memberPage.goto(`/join/${inviteCode}`);
      await expect(memberPage).toHaveTitle(`دعوت به ${groupTitle} | گردون`);
      await expect(memberPage.getByRole("heading", { name: groupTitle })).toBeVisible();
      await memberPage
        .getByRole("button", { name: /پذیرش دعوت|ورود و عضویت/ })
        .click();

      await memberPage.waitForURL(/\/auth\?next=/);
      await signUpViaUi(memberPage, {
        phone: memberPhone,
        fullName: "رضا کریمی",
        card: memberCard,
        iban: memberIban,
      });

      await memberPage.waitForURL(/\/join\/|\/groups\//);
      if (memberPage.url().includes("/join/")) {
        await memberPage
          .getByRole("button", { name: /پذیرش دعوت|ورود و عضویت/ })
          .click();
        await memberPage.waitForURL(/\/groups\/.+/);
      }
      await expect(memberPage.getByRole("heading", { name: groupTitle })).toBeVisible();

      // 4. Owner launches group & executes Round 1 due-date draw
      await ownerPage.goto(groupUrl);
      await expect(
        ownerPage.getByRole("button", { name: /شروع رسمی صندوق با ۲ عضو/ })
      ).toBeVisible();
      await ownerPage
        .getByRole("button", { name: /شروع رسمی صندوق با ۲ عضو/ })
        .click();

      await expect(
        ownerPage.getByRole("button", { name: /اجرای قرعه‌کشی سررسید/ })
      ).toBeVisible();
      await ownerPage
        .getByRole("button", { name: /اجرای قرعه‌کشی سررسید/ })
        .click();

      await expect(ownerPage.getByText("برنده خوش‌شانس این دور:")).toBeVisible();

      // Identify which browser holds the payer vs beneficiary role
      await memberPage.reload();
      await expect(memberPage.getByText("برنده خوش‌شانس این دور:")).toBeVisible();

      const ownerHasUpload =
        (await ownerPage.getByRole("button", { name: /ثبت رسید واریز/ }).count()) > 0;
      const payerPage = ownerHasUpload ? ownerPage : memberPage;
      const beneficiaryPage = ownerHasUpload ? memberPage : ownerPage;

      // 5. Payer uploads valid PNG receipt
      await payerPage.getByRole("button", { name: /ثبت رسید واریز/ }).click();
      await payerPage.locator('input[type="file"]').setInputFiles({
        name: "receipt-1.png",
        mimeType: "image/png",
        buffer: createTestPngBuffer(),
      });
      await payerPage
        .getByRole("textbox", { name: "شماره پیگیری / مرجع (اختیاری)" })
        .fill("774411");
      await payerPage.getByRole("button", { name: /ارسال رسید واریز/ }).click();

      await expect(
        payerPage.getByText("در انتظار تایید", { exact: true })
      ).toBeVisible();

      // 6. Beneficiary rejects first receipt
      await beneficiaryPage.reload();
      await beneficiaryPage
        .getByRole("button", { name: /بررسی و تایید رسید/ })
        .click();
      await beneficiaryPage.getByRole("button", { name: "رد رسید" }).click();
      await beneficiaryPage
        .getByRole("textbox", { name: "دلیل رد رسید" })
        .fill("تصویر قبلی تار است");
      await beneficiaryPage.getByRole("button", { name: /ثبت رد رسید/ }).click();

      await payerPage.reload();
      await expect(payerPage.getByText(/تصویر قبلی تار است/).first()).toBeVisible();
      await expect(
        payerPage.getByRole("button", { name: /ارسال مجدد رسید/ })
      ).toBeVisible();

      // 7. Payer re-uploads receipt and beneficiary confirms it -> round settles
      await payerPage.getByRole("button", { name: /ارسال مجدد رسید/ }).click();
      await payerPage.locator('input[type="file"]').setInputFiles({
        name: "receipt-2.png",
        mimeType: "image/png",
        buffer: createTestPngBuffer(),
      });
      await payerPage
        .getByRole("textbox", { name: "شماره پیگیری / مرجع (اختیاری)" })
        .fill("885522");
      await payerPage.getByRole("button", { name: /ارسال رسید واریز/ }).click();

      await beneficiaryPage.reload();
      await beneficiaryPage
        .getByRole("button", { name: /بررسی و تایید رسید/ })
        .click();
      await beneficiaryPage.getByRole("button", { name: /تایید واریز/ }).click();

      // Round 1 settles (✓) and UI auto-advances to Round 2 (PENDING_DRAW)
      const round1Tab = beneficiaryPage.getByRole("tab", { name: /دور ۱ ✓/ });
      await expect(round1Tab).toBeVisible();
      await round1Tab.click();

      await expect(
        beneficiaryPage.getByText("تایید شده", { exact: true }).first()
      ).toBeVisible();
      await expect(
        beneficiaryPage.getByText("تسویه‌شده", { exact: true }).first()
      ).toBeVisible();

      // 8. Owner opens Group Chat & posts message
      await ownerPage.getByRole("button", { name: /گفتگو/ }).click();
      await ownerPage.getByRole("textbox", { name: "پیام جدید" }).fill("همه واریزی‌ها انجام شد");
      await ownerPage.getByRole("button", { name: "ارسال پیام" }).click();
      await expect(
        ownerPage.getByText("همه واریزی‌ها انجام شد")
      ).toBeVisible();
    } finally {
      await ownerCtx.close();
      await memberCtx.close();
    }
  });
});
