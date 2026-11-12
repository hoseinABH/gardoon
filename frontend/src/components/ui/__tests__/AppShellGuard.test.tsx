import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShellGuard } from "../AppShellGuard";

describe("AppShellGuard native app-like interactions", () => {
  it("prevents contextmenu outside inputs while allowing it inside inputs", () => {
    const { container } = render(
      <div>
        <AppShellGuard />
        <div data-testid="card">متن کارت</div>
        <input data-testid="field" defaultValue="09123456789" />
      </div>
    );

    const card = container.querySelector("[data-testid='card']")!;
    const input = container.querySelector("[data-testid='field']")!;

    const cardCtx = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    card.dispatchEvent(cardCtx);
    expect(cardCtx.defaultPrevented).toBe(true);

    const inputCtx = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    input.dispatchEvent(inputCtx);
    expect(inputCtx.defaultPrevented).toBe(false);
  });

  it("blocks ctrl/meta zoom wheel and zoom keys while leaving normal scroll and typing untouched", () => {
    render(<AppShellGuard />);

    const ctrlWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -100,
    });
    document.dispatchEvent(ctrlWheel);
    expect(ctrlWheel.defaultPrevented).toBe(true);

    const normalWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    });
    document.dispatchEvent(normalWheel);
    expect(normalWheel.defaultPrevented).toBe(false);

    const zoomKey = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      metaKey: true,
      key: "+",
    });
    document.dispatchEvent(zoomKey);
    expect(zoomKey.defaultPrevented).toBe(true);

    const normalKey = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "a",
    });
    document.dispatchEvent(normalKey);
    expect(normalKey.defaultPrevented).toBe(false);
  });

  it("prevents dragstart and Safari gesture zoom events", () => {
    render(<AppShellGuard />);

    const dragEv = new Event("dragstart", { bubbles: true, cancelable: true });
    document.dispatchEvent(dragEv);
    expect(dragEv.defaultPrevented).toBe(true);

    const gestureEv = new Event("gesturestart", { bubbles: true, cancelable: true });
    document.dispatchEvent(gestureEv);
    expect(gestureEv.defaultPrevented).toBe(true);
  });
});
