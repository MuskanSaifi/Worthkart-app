/**
 * Phone pe Expo Go se test karte waqt LAN IP use karo (localhost phone pe kaam nahi karta).
 * Wi‑Fi IP change ho to `.env` mein EXPO_PUBLIC_API_URL update karo, phir Expo restart.
 */
import Constants from "expo-constants";

const extraUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;

export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL || extraUrl || "http://192.168.1.150:3000").replace(
    /\/$/,
    ""
  );
