import { api } from "./client";

const QUEUE_KEY = "gardoon_offline_receipt_queue";

export interface QueuedReceipt {
  obligationId: string;
  idempotencyKey: string;
  trackingReference: string;
  dataUrl: string;
  fileName: string;
  queuedAt: string;
}

function readQueue(): QueuedReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedReceipt[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedReceipt[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

export async function enqueueReceiptUpload(
  obligationId: string,
  file: File,
  trackingReference: string,
  idempotencyKey: string
) {
  const dataUrl = await fileToDataUrl(file);
  const items = readQueue().filter((q) => q.obligationId !== obligationId);
  items.push({
    obligationId,
    idempotencyKey,
    trackingReference,
    dataUrl,
    fileName: file.name || "receipt.jpg",
    queuedAt: new Date().toISOString(),
  });
  writeQueue(items);
}

export function getQueuedCount(): number {
  return readQueue().length;
}

export async function flushQueuedReceipts(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
  const items = readQueue();
  if (items.length === 0) return 0;

  let flushed = 0;
  const remaining: QueuedReceipt[] = [];
  for (const item of items) {
    try {
      const file = await dataUrlToFile(item.dataUrl, item.fileName);
      await api.obligations.submitReceipt(
        item.obligationId,
        file,
        item.trackingReference,
        item.idempotencyKey
      );
      flushed += 1;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return flushed;
}
