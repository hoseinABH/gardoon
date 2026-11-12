import { expect, test } from "@playwright/test";
import { makeLuhnCard, makeValidSheba, randomIranPhone, signUpViaUi } from "./helpers";

test.describe("Onboarding, SEO Metadata, Auth & Profile flows", () => {
  test("displays logo-only onboarding header, floating images without border, and finishes to /auth", async ({
    page,
    context,
  }) => {
    const hydrationErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /hydration|did not match/i.test(msg.text())) {
        hydrationErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      if (/hydration|did not match/i.test(err.message)) {
        hydrationErrors.push(err.message);
      }
    });

    await page.goto("/");
    await expect(page).toHaveTitle("گردون — صندوق قرض‌الحسنه هوشمند");

    const logo = page.getByLabel("گردون");
    await expect(logo).toBeVisible();
    await expect(page.getByRole("heading", { name: "هم‌افزایی سرمایه" })).toBeVisible();

    const slideImg = page.getByAltText("هم‌افزایی سرمایه");
    await expect(slideImg).toBeVisible();
    const className = await slideImg.getAttribute("class");
    expect(className ?? "").not.toContain("border");

    await page.getByRole("button", { name: /بعدی/ }).click();
    await expect(page.getByRole("heading", { name: "انتخاب عادلانه برنده" })).toBeVisible();

    await page.getByRole("button", { name: /بعدی/ }).click();
    await expect(page.getByRole("heading", { name: "تضمین و ثبت رسید" })).toBeVisible();
    await expect(page.getByRole("button", { name: "رد شدن" })).toHaveCount(0);

    await page.getByRole("button", { name: /شروع کنیم/ }).click();
    await page.waitForURL("/auth");
    await expect(page).toHaveTitle("ورود و ثبت‌نام | گردون");

    // Server/proxy redirects "/" straight to /auth via cookie (no onboarding flash)
    const redirectResp = await page.goto("/");
    expect(redirectResp?.request().redirectedFrom()?.url()).toMatch(/\/$/);
    await expect(page).toHaveURL(/\/auth$/);

    // Clear both storage & cookies, then verify skipping sets cookie + server-redirects "/"
    await page.evaluate(() => window.localStorage.clear());
    await context.clearCookies();
    await page.goto("/");
    await expect(page.getByRole("button", { name: "رد شدن" })).toBeVisible();
    await page.getByRole("button", { name: "رد شدن" }).click();
    await page.waitForURL("/auth");

    const cookies = await context.cookies();
    expect(
      cookies.some((c) => c.name === "gardoon_onboarding_seen" && c.value === "1")
    ).toBe(true);

    const skipRedirectResp = await page.goto("/");
    expect(skipRedirectResp?.request().redirectedFrom()?.url()).toMatch(/\/$/);
    await expect(page).toHaveURL(/\/auth$/);
    expect(hydrationErrors).toEqual([]);
  });

  test("validates OTP phone format, primary button dark ink contrast, Material outlined field, offline sheet, and registers new user", async ({
    page,
    context,
  }) => {
    await page.goto("/auth");

    // Verify native app-like viewport, overscroll-none, zoom prevention & text selection rules
    const viewportContent = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewportContent).toContain("maximum-scale=1");
    expect(viewportContent).toContain("user-scalable=no");

    const appBehavior = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      const inputEl = document.querySelector("input");
      const inputStyle = inputEl ? window.getComputedStyle(inputEl) : null;
      return {
        overscrollBehavior: bodyStyle.overscrollBehavior,
        userSelect: bodyStyle.userSelect,
        touchAction: bodyStyle.touchAction,
        inputUserSelect: inputStyle?.userSelect,
      };
    });
    expect(appBehavior.overscrollBehavior).toBe("none");
    expect(appBehavior.userSelect).toBe("none");
    expect(appBehavior.touchAction).toBe("manipulation");
    expect(appBehavior.inputUserSelect).toBe("text");

    // Verify Material outlined fieldset notch and high-contrast dark ink on primary button
    await expect(page.locator("fieldset legend")).toHaveCount(1);
    const submitBtn = page.getByRole("button", { name: /دریافت کد تایید/ });
    const btnColors = await submitBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { color: style.color, backgroundColor: style.backgroundColor };
    });
    expect(btnColors.color).toBe("rgb(15, 20, 6)");
    expect(btnColors.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    // Verify Next.js offline detection sheet triggers on network loss
    await context.setOffline(true);
    await expect(
      page.getByRole("heading", { name: "اتصال اینترنت برقرار نیست" })
    ).toBeVisible();
    await page.getByRole("button", { name: "متوجه شدم" }).click();
    await context.setOffline(false);

    // Client validation guard for short/invalid Iranian phone
    await page.getByRole("textbox", { name: "شماره موبایل" }).fill("09123");
    await submitBtn.click();
    await expect(page.getByText(/شماره موبایل باید ۱۱ رقم/)).toBeVisible();

    const phone = randomIranPhone();
    const initialCard = makeLuhnCard("603799759912345");
    const updatedCard = makeLuhnCard("621986101234567");
    const iban = makeValidSheba(`2960000000${phone.slice(1)}0`);

    await signUpViaUi(page, {
      phone,
      fullName: "امیرحسین رضایی",
      card: initialCard,
      iban,
    });

    await expect(page).toHaveURL(/\/home$/);
    await expect(page).toHaveTitle("صندوق‌های من | گردون");
    await expect(page.getByRole("heading", { name: "امیرحسین رضایی" })).toBeVisible();

    // Icon-only BottomNav highlights active route without label text
    const homeNavLink = page.getByRole("link", { name: "صندوق‌ها" });
    await expect(homeNavLink).toHaveAttribute("aria-current", "page");
    expect(await homeNavLink.innerText()).toBe("");

    // Navigate to Profile via bottom navigation and verify active pill shifts
    await page.getByRole("link", { name: "پروفایل" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page).toHaveTitle("پروفایل و حساب بانکی | گردون");
    await expect(page.getByRole("link", { name: "پروفایل" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    // BankCard preview displays Latin digits and Bank Melli SVG icon cleanly
    const groupedInitialLatin = initialCard.replace(/(.{4})(?=.)/g, "$1 ");
    await expect(page.getByText(groupedInitialLatin)).toBeVisible();
    await expect(page.getByAltText("بانک ملی ایران")).toBeVisible();

    // Update default card and persist
    const cardInput = page.getByRole("textbox", {
      name: "شماره کارت پیش‌فرض دریافت وام",
    });
    await cardInput.fill(updatedCard);
    await page.getByRole("button", { name: /ذخیره مشخصات بانکی/ }).click();
    await expect(page.getByText(/اطلاعات بانکی ذخیره شد/).first()).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "شماره کارت پیش‌فرض دریافت وام" })
    ).toHaveValue(updatedCard);

    // Logout redirects to auth screen
    await page.getByRole("button", { name: /خروج از حساب کاربری/ }).click();
    await expect(page).toHaveURL(/\/auth$/);
  });
});
