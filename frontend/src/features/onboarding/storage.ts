export const ONBOARDING_SEEN_KEY = "gardoon_onboarding_seen_v1";
export const ONBOARDING_COOKIE_NAME = "gardoon_onboarding_seen";

function hasOnboardingCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${ONBOARDING_COOKIE_NAME}=1`);
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (hasOnboardingCookie()) return true;
    return window.localStorage.getItem(ONBOARDING_SEEN_KEY) === "1";
  } catch {
    return hasOnboardingCookie();
  }
}

export function markOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  try {
    document.cookie = `${ONBOARDING_COOKIE_NAME}=1; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    // Ignore cookie errors in restricted contexts
  }
  try {
    window.localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
  } catch {
    // Ignore storage quota / private mode errors
  }
}
