/** Back jab history na ho (search deep-link etc.) to home pe le jao. */
export function safeBack(
  router: { canGoBack: () => boolean; back: () => void; replace: (href: any) => void },
  fallback: string = "/(tabs)"
) {
  try {
    if (router.canGoBack()) {
      router.back();
      return;
    }
  } catch {
    // fall through to home
  }
  router.replace(fallback);
}

export function goHome(router: { replace: (href: any) => void }) {
  router.replace("/(tabs)");
}
