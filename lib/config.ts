/**
 * API base URL:
 * - Release / EAS build → https://worthkart.in
 * - Expo Go phone (__DEV__) → EXPO_PUBLIC_API_URL (production or LAN IP)
 * - Expo web (__DEV__) → localhost:3000 (browser + local Next; avoids CORS to remote)
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

const PRODUCTION_API_URL = "https://worthkart.in";
const LOCAL_FALLBACK = "http://localhost:3000";

const envUrl = (process.env.EXPO_PUBLIC_API_URL || "").trim();
const extraUrl = ((Constants.expoConfig?.extra?.apiUrl as string | undefined) || "").trim();

function pickApiUrl() {
  if (!__DEV__) {
    return envUrl || extraUrl || PRODUCTION_API_URL;
  }
  // Browser Metro: always hit local website (CORS headers applied in next.config)
  if (Platform.OS === "web") {
    return LOCAL_FALLBACK;
  }
  // Expo Go / native: prefer .env (LAN IP for local website, or worthkart.in)
  return envUrl || LOCAL_FALLBACK;
}

export const API_BASE_URL = pickApiUrl().replace(/\/$/, "");

export const IS_PRODUCTION_API = /worthkart\.in$/i.test(
  API_BASE_URL.replace(/^https?:\/\//, "").split("/")[0] || ""
);
