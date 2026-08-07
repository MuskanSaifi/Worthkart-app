import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type SellerSession = {
  id: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  role: string;
  businessName: string;
  sellerStatus?: string | null;
  token: string;
};

type SellerContextValue = {
  seller: SellerSession | null;
  ready: boolean;
  isSellerLoggedIn: boolean;
  loginSeller: (s: SellerSession) => Promise<void>;
  logoutSeller: () => Promise<void>;
};

const KEY = "wk_seller_auth_v1";
const SellerContext = createContext<SellerContextValue | null>(null);

export function SellerProvider({ children }: { children: React.ReactNode }) {
  const [seller, setSeller] = useState<SellerSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SellerSession>;
          if (parsed?.token && parsed?.id && parsed?.email) {
            setSeller(parsed as SellerSession);
          } else {
            await AsyncStorage.removeItem(KEY);
          }
        }
      } catch {
        setSeller(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const loginSeller = useCallback(async (next: SellerSession) => {
    setSeller(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const logoutSeller = useCallback(async () => {
    setSeller(null);
    await AsyncStorage.removeItem(KEY);
  }, []);

  const value = useMemo(
    () => ({
      seller,
      ready,
      isSellerLoggedIn: !!seller,
      loginSeller,
      logoutSeller,
    }),
    [seller, ready, loginSeller, logoutSeller]
  );

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>;
}

export function useSeller() {
  const ctx = useContext(SellerContext);
  if (!ctx) throw new Error("useSeller must be used within SellerProvider");
  return ctx;
}
