import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingScreen } from "../OnboardingScreen";
import { ONBOARDING_COOKIE_NAME, ONBOARDING_SEEN_KEY } from "../storage";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

vi.mock("@/features/auth/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/store")>();
  return {
    ...actual,
    useAuthStore: () => ({
      user: null,
      hydrated: true,
    }),
  };
});

describe("OnboardingScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = `${ONBOARDING_COOKIE_NAME}=; Path=/; Max-Age=0`;
    pushMock.mockReset();
    replaceMock.mockReset();
  });

  it("shows logo-only header, borderless floating image, finishes 3 slides and persists seen flag", async () => {
    const user = userEvent.setup();
    render(<OnboardingScreen />);

    const logo = screen.getByLabelText("گردون");
    expect(logo.tagName.toLowerCase()).toBe("svg");

    const img1 = screen.getByAltText("هم‌افزایی سرمایه");
    expect(img1.getAttribute("src")).toContain("onb-cards.png");
    expect(img1.className).not.toContain("border");

    await user.click(screen.getByRole("button", { name: /بعدی/ }));
    expect(await screen.findByText("انتخاب عادلانه برنده")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /بعدی/ }));
    expect(await screen.findByText("تضمین و ثبت رسید")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "رد شدن" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /شروع کنیم/ }));

    expect(window.localStorage.getItem(ONBOARDING_SEEN_KEY)).toBe("1");
    expect(document.cookie).toContain(`${ONBOARDING_COOKIE_NAME}=1`);
    expect(pushMock).toHaveBeenCalledWith("/auth");
  });

  it("persists seen flag when user skips onboarding", async () => {
    const user = userEvent.setup();
    render(<OnboardingScreen />);

    await user.click(screen.getByRole("button", { name: "رد شدن" }));
    expect(window.localStorage.getItem(ONBOARDING_SEEN_KEY)).toBe("1");
    expect(document.cookie).toContain(`${ONBOARDING_COOKIE_NAME}=1`);
    expect(pushMock).toHaveBeenCalledWith("/auth");
  });

  it("redirects immediately to /auth without rendering slides when onboarding was already seen", () => {
    window.localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    const { container } = render(<OnboardingScreen />);

    expect(replaceMock).toHaveBeenCalledWith("/auth");
    expect(container.firstChild).toBeNull();
  });
});
