import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { createAppSession, sendLoginOtp, verifyOtp } from "@/lib/api";
import { safeBack } from "@/lib/navigation";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { useBottomInset } from "@/lib/safe-layout";

export default function LoginScreen() {
  const router = useRouter();
  const bottom = useBottomInset();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { isLoggedIn, ready, login, user } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [target, setTarget] = useState("");

  const cleaned = phone.replace(/\D/g, "").slice(-10);

  const finish = () => {
    if (returnTo === "checkout" || returnTo === "/checkout") {
      router.replace("/checkout");
      return;
    }
    if (returnTo === "cart") {
      router.replace("/(tabs)/cart");
      return;
    }
    if (returnTo === "account") {
      router.replace("/(tabs)/account");
      return;
    }
    if (returnTo === "orders") {
      router.replace("/(tabs)/orders");
      return;
    }
    if (returnTo === "profile") {
      router.replace("/profile");
      return;
    }
    safeBack(router);
  };

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isLoggedIn]);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user?.phone]);

  const onSendOtp = async () => {
    if (cleaned.length !== 10) {
      notify.error("Invalid number", "Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const data = await sendLoginOtp(cleaned);
      // Always use normalized phone — never empty / mismatched target
      const nextTarget = (data.target || cleaned).replace(/\D/g, "").slice(-10);
      setTarget(nextTarget);
      setDevOtp(data.devOtp || "");
      setStep("otp");
      if (data.devOtp) notify.info("Dev OTP", `Your OTP is ${data.devOtp}`);
      else notify.success("OTP sent", `Sent to ${nextTarget}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send OTP";
      notify.error("Login failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    const cleanedOtp = otp.replace(/\D/g, "");
    const phoneTarget = (target || cleaned).replace(/\D/g, "").slice(-10);
    if (phoneTarget.length !== 10) {
      notify.error("Invalid number", "Request OTP again");
      setStep("phone");
      return;
    }
    if (cleanedOtp.length < 4) {
      notify.error("Invalid OTP", "Enter the OTP you received");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp({ target: phoneTarget, type: "phone", code: cleanedOtp });
      const session = await createAppSession(phoneTarget);
      await login({
        id: session.user.id,
        phone: session.user.phone,
        name: session.user.name,
        token: session.token,
        loggedInAt: new Date().toISOString(),
      });
      notify.success("Logged in", `Welcome ${phoneTarget}`);
      finish();
    } catch (e) {
      notify.error("OTP failed", e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <View style={styles.page}>
        <AppHeader showBack showSearch={false} title="Login" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Buyer Login" />
      <View style={[styles.body, { paddingBottom: 24 + bottom }]}>
        <View style={styles.hero}>
          <FontAwesome name="mobile" size={28} color={colors.primary} />
          <Text style={styles.heroTitle}>Welcome Back</Text>
          <Text style={styles.heroSub}>Login securely with mobile number + OTP</Text>
        </View>

        {step === "phone" ? (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
              keyboardType="number-pad"
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={10}
            />
            <Pressable
              style={[styles.btn, cleaned.length !== 10 && styles.btnDisabled]}
              onPress={onSendOtp}
              disabled={loading || cleaned.length !== 10}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.btnText}>Send OTP</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.hint}>OTP sent to {target}</Text>
            {devOtp ? <Text style={styles.dev}>Dev OTP: {devOtp}</Text> : null}
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 8))}
              keyboardType="number-pad"
              placeholder="Enter OTP"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={8}
            />
            <Pressable style={styles.btn} onPress={onVerify} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.btnText}>Verify & Login</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStep("phone")}>
              <Text style={styles.link}>← Change number</Text>
            </Pressable>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerMuted}>
            No signup needed — OTP creates your buyer account. Profile details later.
          </Text>
          <Text style={styles.footerMuted}>Need Seller Hub?</Text>
          <Link href="/seller/login" asChild>
            <Pressable>
              <Text style={styles.link}>Seller Login →</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20 },
  hero: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground, marginTop: 10 },
  heroSub: { color: colors.muted, fontSize: 13, marginTop: 4, textAlign: "center" },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.foreground,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  hint: { color: colors.muted, marginBottom: 8 },
  dev: { color: colors.accent, marginBottom: 10, fontWeight: "700" },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: colors.primary,
    fontWeight: "700",
  },
  hintBox: {
    marginTop: 14,
    backgroundColor: "#faf5ff",
    borderWidth: 1,
    borderColor: "#e9d5ff",
    borderRadius: 12,
    padding: 12,
  },
  hintBoxText: { color: colors.primary, fontWeight: "700", fontSize: 13, textAlign: "center" },
  footer: { marginTop: 28, alignItems: "center", gap: 4 },
  footerMuted: { color: colors.muted, fontSize: 13 },
});
