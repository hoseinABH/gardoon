export const INSTALL_DISMISSED_KEY = "gardoon_pwa_install_dismissed_until";

export function isInstallPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(days = 7): void {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, String(until));
  } catch {
    // Ignore storage quota or privacy-mode errors
  }
}

export function clearInstallPromptDismissal(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(INSTALL_DISMISSED_KEY);
  } catch {
    // Ignore storage errors
  }
}
