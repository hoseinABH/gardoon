import { expect, test } from "@playwright/test";
import {
  makeLuhnCard,
  makeValidSheba,
  randomIranPhone,
  signUpViaUi,
} from "./helpers";

test.describe("Production PWA & Profile Sheet flows", () => {
  test("opens custom Install App Sheet and New Version Update Sheet from profile", async ({
    page,
  }) => {
    const phone = randomIranPhone(45);
    const card = makeLuhnCard("603799759911999");
    const iban = makeValidSheba(`2960000000${phone.slice(1)}9`);

    await signUpViaUi(page, {
      phone,
      fullName: "کاربر آزمایشی شیت",
      card,
      iban,
      startUrl: "/auth",
    });

    await expect(page).toHaveURL(/\/home$/);

    await page.getByRole("link", { name: "پروفایل" }).click();
    await expect(page).toHaveURL(/\/profile$/);

    // Open Install App Sheet
    await page.getByRole("button", { name: /نصب برنامه/ }).click();
    await expect(
      page.getByRole("heading", { name: "نصب وب‌اپلیکیشن گردون" })
    ).toBeVisible();
    await page.getByRole("button", { name: "متوجه شدم" }).click();
    await expect(
      page.getByRole("heading", { name: "نصب وب‌اپلیکیشن گردون" })
    ).toHaveCount(0);

    // Open Update / Stale Data Sheet
    await page
      .getByRole("button", { name: /بررسی به‌روزرسانی و دریافت اطلاعات تازه/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "نسخه جدید گردون آماده است" })
    ).toBeVisible();
    await expect(
      page.getByText(/پاک‌سازی داده‌های قدیمی و منقضی/)
    ).toBeVisible();
    await page.getByRole("button", { name: "بعداً یادآوری کن" }).click();
    await expect(
      page.getByRole("heading", { name: "نسخه جدید گردون آماده است" })
    ).toHaveCount(0);
  });
});
