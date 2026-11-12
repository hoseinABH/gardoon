const MAX_BYTES = 350 * 1024;
const MAX_DIMENSION = 1280;

export async function compressReceiptImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("فایل انتخاب‌شده تصویر نیست");
  }
  if (file.size <= MAX_BYTES && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const qualities = [0.82, 0.7, 0.58, 0.45];
  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (blob && (blob.size <= MAX_BYTES || quality === qualities[qualities.length - 1])) {
      const name = file.name.replace(/\.[^.]+$/, "") || "receipt";
      return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
    }
  }

  return file;
}
