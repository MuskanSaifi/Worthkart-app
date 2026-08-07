import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthUser = {
  id: string;
  phone: string;
  name?: string | null;
  token: string;
  loggedInAt: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  isLoggedIn: boolean;
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
};

const AUTH_KEY = "wk_auth_v1";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AuthUser>;
          if (parsed?.token && parsed?.id && parsed?.phone) {
            setUser(parsed as AuthUser);
          } else {
            await AsyncStorage.removeItem(AUTH_KEY);
            setUser(null);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (next: AuthUser) => {
    setUser(next);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isLoggedIn: !!user,
      login,
      logout,
    }),
    [user, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
