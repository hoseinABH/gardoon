import { expect, type Page } from "@playwright/test";
import zlib from "node:zlib";

export function randomIranPhone(seedOffset = 0): string {
  const rand = Math.floor(10_000_000 + Math.random() * 89_000_000 + seedOffset) % 90_000_000 + 10_000_000;
  return `091${String(rand).slice(0, 8)}`;
}

export function makeLuhnCard(prefix15 = "603799759912345"): string {
  const clean = prefix15.replace(/\D/g, "").slice(0, 15).padEnd(15, "0");
  let sum = 0;
  for (let i = 0; i < 15; i += 1) {
    let digit = Number(clean[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${clean}${check}`;
}

export function makeValidSheba(accountDigits22 = "2960000000100324200001"): string {
  const bban = accountDigits22.replace(/\D/g, "").slice(0, 22).padStart(22, "0");
  const numeric = `${bban}182700`;
  let rem = 0;
  for (const ch of numeric) {
    rem = (rem * 10 + Number(ch)) % 97;
  }
  const check = String(98 - rem).padStart(2, "0");
  return `IR${check}${bban}`;
}

export async function signUpViaUi(
  page: Page,
  opts: {
    phone: string;
    fullName: string;
    card: string;
    iban: string;
    startUrl?: string;
  }
): Promise<void> {
  if (opts.startUrl) {
    await page.goto(opts.startUrl);
  }
  await page.getByRole("textbox", { name: "شماره موبایل" }).fill(opts.phone);
  await page.getByRole("button", { name: /دریافت کد تایید/ }).click();

  const otpInput = page.getByRole("textbox", { name: "کد تایید ۵ رقمی" });
  await expect(otpInput).toBeVisible();
  const codeValue = await otpInput.inputValue();
  if (!codeValue) {
    await otpInput.fill("12345");
  }
  await page.getByRole("textbox", { name: "نام و نام خانوادگی" }).fill(opts.fullName);
  await page.getByRole("button", { name: /تایید و ورود/ }).click();

  await expect(page.getByRole("textbox", { name: "شماره کارت ۱۶ رقمی" })).toBeVisible();
  await page.getByRole("textbox", { name: "شماره کارت ۱۶ رقمی" }).fill(opts.card);
  await page.getByRole("textbox", { name: "شماره شبا (۲۶ کاراکتر با IR)" }).fill(opts.iban);
  await page.getByRole("textbox", { name: "نام صاحب حساب" }).fill(opts.fullName);
  await page.getByRole("button", { name: /ذخیره و ورود به برنامه/ }).click();

  await page.waitForURL(/\/(home|join\/)/);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

export function createTestPngBuffer(width = 16, height = 16): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowStride = 1 + width * 3;
  const raw = Buffer.alloc(rowStride * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowStride;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const px = rowStart + 1 + x * 3;
      raw[px] = 198;
      raw[px + 1] = 244;
      raw[px + 2] = 50;
    }
  }
  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
