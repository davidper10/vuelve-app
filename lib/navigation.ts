import { router } from 'expo-router';

// router.back() lanza "GO_BACK not handled" cuando la pantalla se abrió
// sin historial previo (deep link, recarga web, o tras un router.replace).
export function safeBack(fallbackHref: string) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref as never);
  }
}
