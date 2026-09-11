import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Visible tab row (icon + label), not including the system nav / home indicator. */
export const TAB_BAR_BODY = 56;

/**
 * 3-button Android nav is ~48dp. With Expo edge-to-edge, insets.bottom is often 0
 * even though the system bar covers the screen. Floor keeps CTAs usable.
 * Keyboard open: drop the floor so inputs can sit above the keyboard.
 */
const ANDROID_NAV_FLOOR = 48;

export function useBottomInset() {
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardOpen) return 0;
  const floor = Platform.OS === "android" ? ANDROID_NAV_FLOOR : 0;
  return Math.max(insets.bottom, floor);
}

/** Extra padding inside a sticky footer so buttons sit above the system nav. */
export function useDockPadding(extra = 12) {
  const bottom = useBottomInset();
  return extra + bottom;
}
