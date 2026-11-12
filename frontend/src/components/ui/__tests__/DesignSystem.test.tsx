import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BankCard } from "../BankCard";
import { BottomNav } from "../BottomNav";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { SelectField, TextField } from "../TextField";
import { Tabs } from "../Tabs";
import { Typography } from "../Typography";

const mockUsePathname = vi.fn(() => "/home");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("Material Design System components", () => {
  it("renders Button variants, triggers ripple element on pointerDown, and handles loading state", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container, rerender } = render(
      <Button variant="lime" onClick={onClick}>
        ایجاد صندوق
      </Button>
    );

    const btn = screen.getByRole("button", { name: "ایجاد صندوق" });
    expect(btn.className).toContain("text-on-primary");
    expect(btn.className).toContain("h-11");
    fireEvent.pointerDown(btn, { clientX: 20, clientY: 16 });
    expect(container.querySelector(".animate-ripple")).toBeInTheDocument();

    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button variant="lime" loading loadingLabel="در حال ثبت...">
        ایجاد صندوق
      </Button>
    );
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("در حال ثبت...")).toBeInTheDocument();

    rerender(
      <Button variant="lime" loading>
        ایجاد صندوق
      </Button>
    );
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.queryByText("در حال پردازش...")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "در حال بارگذاری" })).toBeInTheDocument();
  });

  it("renders IconButton with aria-label and ripple", () => {
    const { container } = render(
      <IconButton aria-label="بازگشت">
        <span>←</span>
      </IconButton>
    );
    const btn = screen.getByRole("button", { name: "بازگشت" });
    fireEvent.pointerDown(btn, { clientX: 12, clientY: 12 });
    expect(container.querySelector(".animate-ripple")).toBeInTheDocument();
  });

  it("normalizes Persian digits in TextField, exposes clear button, and renders error/hint", async () => {
    const user = userEvent.setup();
    const values: string[] = [];
    const onClear = vi.fn();

    const { rerender } = render(
      <TextField
        label="شماره موبایل"
        value=""
        onChange={(e) => values.push(e.target.value)}
        numericNormalize
        clearable
        onClear={onClear}
        hint="با ۰۹ شروع شود"
      />
    );

    const input = screen.getByLabelText("شماره موبایل");
    await user.type(input, "۰");
    expect(values).toContain("0");
    expect(screen.getByText("با ۰۹ شروع شود")).toBeInTheDocument();

    rerender(
      <TextField
        label="شماره موبایل"
        value="0912"
        onChange={(e) => values.push(e.target.value)}
        numericNormalize
        clearable
        onClear={onClear}
        error="شماره معتبر نیست"
      />
    );

    expect(screen.getByText("شماره معتبر نیست")).toBeInTheDocument();
    const clearBtn = screen.getByRole("button", { name: "پاک کردن شماره موبایل" });
    await user.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders SelectField and fires onChange with selected option value", async () => {
    const user = userEvent.setup();
    const selected: string[] = [];
    render(
      <SelectField
        label="دوره پرداخت"
        value="MONTHLY"
        onChange={(e) => selected.push(e.target.value)}
        options={[
          { value: "WEEKLY", label: "هفتگی" },
          { value: "MONTHLY", label: "ماهانه" },
        ]}
      />
    );

    const select = screen.getByLabelText("دوره پرداخت");
    await user.selectOptions(select, "WEEKLY");
    expect(selected).toContain("WEEKLY");
  });

  it("switches Tabs cleanly and sets aria-selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Tabs
        value="all"
        onChange={onChange}
        items={[
          { id: "all", label: "همه" },
          { id: "pending", label: "در انتظار" },
        ]}
      />
    );

    const allTab = screen.getByRole("tab", { name: "همه" });
    const pendingTab = screen.getByRole("tab", { name: "در انتظار" });
    expect(allTab).toHaveAttribute("aria-selected", "true");
    expect(pendingTab).toHaveAttribute("aria-selected", "false");

    await user.click(pendingTab);
    expect(onChange).toHaveBeenCalledWith("pending");
  });

  it("renders semantic tags and tones in Typography without leaking text-foreground", () => {
    render(
      <>
        <Typography variant="display-lg">تیتر اصلی</Typography>
        <Typography variant="body-sm" tone="muted">
          متن توضیح
        </Typography>
        <Typography variant="label-md" tone="inherit">
          متن ارث‌بری‌شده
        </Typography>
        <Typography variant="label-md" tone="on-primary">
          متن روی رنگ اصلی
        </Typography>
      </>
    );

    const h1 = screen.getByRole("heading", { level: 1, name: "تیتر اصلی" });
    expect(h1).toHaveClass("text-3xl", "font-black", "text-foreground");
    expect(screen.getByText("متن توضیح")).toHaveClass("text-muted-foreground");
    expect(screen.getByText("متن توضیح").className).not.toContain("text-foreground");
    expect(screen.getByText("متن ارث‌بری‌شده")).toHaveClass("text-current");
    expect(screen.getByText("متن ارث‌بری‌شده").className).not.toContain("text-foreground");
    expect(screen.getByText("متن روی رنگ اصلی")).toHaveClass("text-on-primary");
    expect(screen.getByText("متن روی رنگ اصلی").className).not.toContain("text-foreground");
  });

  it("renders icon-only BottomNav links with primary pill on active route", () => {
    mockUsePathname.mockReturnValue("/home");
    const { rerender } = render(<BottomNav />);

    const homeLink = screen.getByRole("link", { name: "صندوق‌ها" });
    const createLink = screen.getByRole("link", { name: "صندوق جدید" });
    const profileLink = screen.getByRole("link", { name: "پروفایل" });

    expect(homeLink).toHaveAttribute("aria-current", "page");
    expect(homeLink.textContent).toBe("");
    expect(homeLink.innerHTML).toContain("text-primary");
    expect(createLink).not.toHaveAttribute("aria-current");
    expect(createLink.textContent).toBe("");
    expect(profileLink.textContent).toBe("");

    mockUsePathname.mockReturnValue("/profile");
    rerender(<BottomNav />);
    expect(screen.getByRole("link", { name: "پروفایل" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "صندوق‌ها" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("renders BankCard preview with Latin card and Sheba numerals and official bank logo", () => {
    render(
      <BankCard
        holder="حسین کریمی"
        card="۶۱۰۴۳۳۱۲۳۴۵۶۷۸۹۳"
        iban="IR820120102680020817909002"
      />
    );
    expect(screen.getByText("6104 3312 3456 7893")).toBeInTheDocument();
    expect(
      screen.getByText("IR82 0120 1026 8002 0817 9090 02")
    ).toBeInTheDocument();
    const bankLogo = screen.getByAltText("بانک ملت");
    expect(bankLogo.getAttribute("src")).toContain(
      encodeURIComponent("/banks/mellat.png")
    );
  });
});
