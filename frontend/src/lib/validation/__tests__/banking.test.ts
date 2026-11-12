import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  IRANIAN_BANKS,
  detectBank,
  groupCard,
  groupSheba,
  luhnValid,
  phoneValid,
  shebaValid,
} from "../banking";

describe("Iranian banking & phone validation", () => {
  it("validates Iranian mobile numbers in ASCII and Persian digits", () => {
    expect(phoneValid("09123456789")).toBe(true);
    expect(phoneValid("۰۹۱۲۳۴۵۶۷۸۹")).toBe(true);
    expect(phoneValid("08123456789")).toBe(false);
    expect(phoneValid("0912345")).toBe(false);
  });

  it("validates 16-digit cards with Luhn checksum", () => {
    expect(luhnValid("6037997599123453")).toBe(true);
    expect(luhnValid("۶۰۳۷-۹۹۷۵-۹۹۱۲-۳۴۵۳")).toBe(true);
    expect(luhnValid("6037997599123458")).toBe(false);
    expect(luhnValid("60379975")).toBe(false);
  });

  it("formats card digits into groups of four in Persian or Latin numerals and groups Sheba", () => {
    expect(groupCard("6037997599123453")).toBe("۶۰۳۷ ۹۹۷۵ ۹۹۱۲ ۳۴۵۳");
    expect(groupCard("۶۰۳۷۹۹۷۵۹۹۱۲۳۴۵۳", true)).toBe("6037 9975 9912 3453");
    expect(groupSheba("ir۸۲۰۵۴۰۱۰۲۶۸۰۰۲۰۸۱۷۹۰۹۰۰۲")).toBe(
      "IR82 0540 1026 8002 0817 9090 02"
    );
  });

  it("validates 26-char Iranian Sheba via ISO-7064 Mod-97-10", () => {
    // Valid Iranian Sheba checksum (IR06 + 22 digits => Mod97 == 1)
    expect(shebaValid("IR062960000000100324200001")).toBe(true);
    expect(shebaValid("ir۰۶۲۹۶۰۰۰۰۰۰۰۱۰۰۳۲۴۲۰۰۰۰۱")).toBe(true);
    expect(shebaValid("IR992960000000100324200001")).toBe(false);
    expect(shebaValid("DE062960000000100324200001")).toBe(false);
  });

  it("detects known Iranian bank BINs, Sheba prefixes, and official logos", () => {
    expect(IRANIAN_BANKS).toHaveLength(28);
    expect(
      IRANIAN_BANKS.every((b) => {
        const assetPath = path.join(process.cwd(), "public", b.logo.slice(1));
        return b.logo.startsWith("/banks/") && b.logo.endsWith(".png") && fs.existsSync(assetPath);
      })
    ).toBe(true);
    expect(detectBank("6037997599123458")).toMatchObject({
      name: "بانک ملی ایران",
      logo: "/banks/melli.png",
    });
    expect(detectBank("6104337599123458")).toMatchObject({
      name: "بانک ملت",
      logo: "/banks/mellat.png",
    });
    expect(detectBank("۶۲۱۹۸۶۱۰۱۲۳۴۵۶۷۸")).toMatchObject({
      name: "بانک سامان",
      logo: "/banks/saman.png",
    });
    expect(detectBank("5859831012345678")).toMatchObject({
      name: "بانک خاورمیانه",
      logo: "/banks/khavarmianeh.png",
    });
    expect(detectBank("", "IR820560102680020817909002")).toMatchObject({
      name: "بانک سامان",
      logo: "/banks/saman.png",
    });
    expect(detectBank("", "", "بانک ملی")).toMatchObject({
      name: "بانک ملی ایران",
      logo: "/banks/melli.png",
    });
    expect(detectBank("9999991111111111").name).toBe("بانک شتابی");
    expect(detectBank("603").name).toBe("کارت شتابی");
  });
});
