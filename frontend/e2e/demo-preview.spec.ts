import { expect, test } from "@playwright/test";

test.describe("Offline / Demo Preview flow", () => {
  test("launches demo user dashboard, runs demo due-date draw, and sends demo chat", async ({
    page,
  }) => {
    await page.goto("/auth");
    await page
      .getByRole("button", { name: /مشاهده پیش‌نمایش آزمایشی بدون سرور/ })
      .click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText("حالت پیش‌نمایش آزمایشی")).toBeVisible();

    const activeFilterTabColor = await page
      .getByRole("tab", { name: /همه/ })
      .locator("span")
      .last()
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(activeFilterTabColor).toBe("rgb(7, 18, 7)");

    // Open seeded demo group card
    await page.locator('a[href^="/groups/"]').first().click();
    await page.waitForURL(/\/groups\/.+/);

    await page.getByRole("button", { name: /گفتگو/ }).click();
    await page.getByRole("textbox", { name: "پیام جدید" }).fill("تست پیام آزمایشی");
    await page.getByRole("button", { name: "ارسال پیام" }).click();
    await expect(page.getByText("تست پیام آزمایشی")).toBeVisible();
  });
});
