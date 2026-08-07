import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter, Link } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AppHeader } from "@/components/AppHeader";
import { useSeller } from "@/context/SellerContext";
import { createSellerSession, sendSellerLoginOtp } from "@/lib/seller-api";
import { verifyOtp } from "@/lib/api";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

export default function SellerLoginScreen() {
  const router = useRouter();
  const { loginSeller } = useSeller();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [target, setTarget] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const cleaned = phone.replace(/\D/g, "").slice(-10);

  const onSendOtp = async () => {
    if (cleaned.length !== 10) {
      notify.error("Required", "Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setShowRegister(false);
    try {
      const data = await sendSellerLoginOtp(cleaned);
      setTarget(data.target);
      setDevOtp(data.devOtp || "");
      setStep("otp");
      if (data.devOtp) notify.info("Dev OTP", `Your OTP is ${data.devOtp}`);
      else notify.success("OTP sent", `Sent to ${data.target}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send OTP";
      if (/not registered|register first|buyer account|incomplete|Become a Seller|upgrade/i.test(msg)) {
        setShowRegister(true);
      }
      notify.error("Login failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (otp.length < 4) {
      notify.error("OTP", "Enter the OTP you received");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp({ target, type: "phone", code: otp });
      const session = await createSellerSession(cleaned);
      await loginSeller({
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone,
        name: session.user.name,
        role: session.user.role,
        businessName: session.user.businessName,
        sellerStatus: session.user.sellerStatus,
        token: session.token,
      });
      notify.success("Welcome", session.user.businessName);
      router.replace("/seller");
    } catch (e) {
      notify.error("OTP failed", e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Seller Login" />
      <View style={styles.body}>
        <View style={styles.hero}>
          <FontAwesome name="briefcase" size={28} color={colors.primary} />
          <Text style={styles.heroTitle}>WorthKart Seller Hub</Text>
          <Text style={styles.heroSub}>Login with your registered mobile number</Text>
        </View>

        {step === "phone" ? (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.muted}
            />
            <Pressable
              style={[styles.btn, cleaned.length !== 10 && styles.btnDisabled]}
              onPress={onSendOtp}
              disabled={loading || cleaned.length !== 10}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Send OTP</Text>
              )}
            </Pressable>

            {showRegister ? (
              <Pressable style={styles.hintBox} onPress={() => router.push("/seller/register")}>
                <Text style={styles.hintBoxText}>
                  Buyer only? Register as Seller separately →
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.hint}>OTP sent to {target}</Text>
            {devOtp ? <Text style={styles.dev}>Dev OTP: {devOtp}</Text> : null}
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter OTP"
              placeholderTextColor={colors.muted}
            />
            <Pressable style={styles.btn} onPress={onVerify} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
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
          <Text style={styles.footerMuted}>New seller?</Text>
          <Pressable onPress={() => router.push("/seller/register")}>
            <Text style={styles.link}>Register as Seller →</Text>
          </Pressable>
          <Link href="/login" asChild>
            <Pressable style={{ marginTop: 10 }}>
              <Text style={styles.linkMuted}>Buyer login</Text>
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
  heroTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground, marginTop: 10 },
  heroSub: { color: colors.muted, fontSize: 13, marginTop: 4, textAlign: "center" },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  dev: { color: colors.primary, fontWeight: "700", marginBottom: 8 },
  link: { marginTop: 4, color: colors.primary, fontWeight: "700", textAlign: "center" },
  linkMuted: { color: colors.muted, fontWeight: "600", textAlign: "center" },
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
