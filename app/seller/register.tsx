import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { verifyOtp } from "@/lib/api";
import { useBottomInset } from "@/lib/safe-layout";
import {
  registerSellerStep1,
  registerSellerStep2,
  sendSellerRegisterOtp,
  verifySellerGst,
} from "@/lib/seller-api";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

const BUSINESS_TYPES = [
  { id: "proprietorship", label: "Proprietorship" },
  { id: "partnership", label: "Partnership" },
  { id: "private_limited", label: "Private Limited" },
  { id: "llp", label: "LLP" },
  { id: "other", label: "Other" },
];

export default function SellerRegisterScreen() {
  const bottom = useBottomInset();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [otpType, setOtpType] = useState<"phone" | "email" | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpTarget, setOtpTarget] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("proprietorship");
  const [gstNumber, setGstNumber] = useState("");
  const [gstVerified, setGstVerified] = useState(false);
  const [gstLegalName, setGstLegalName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstBusy, setGstBusy] = useState(false);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, "").slice(-10), [phone]);

  const sendOtp = async (type: "phone" | "email") => {
    const target = type === "phone" ? cleanedPhone : email.trim().toLowerCase();
    if (type === "phone" && cleanedPhone.length !== 10) {
      notify.error("Phone", "Enter a valid 10-digit mobile number");
      return;
    }
    if (type === "email" && !target.includes("@")) {
      notify.error("Email", "Enter a valid email");
      return;
    }
    setOtpLoading(true);
    try {
      const data = await sendSellerRegisterOtp(target, type);
      setOtpType(type);
      setOtpTarget(target);
      setOtpCode("");
      setDevOtp(data.devOtp || "");
      if (data.devOtp) notify.info("Dev OTP", data.devOtp);
      else notify.success("OTP sent", `Check your ${type}`);
    } catch (e) {
      const err = e as Error & { code?: string; loginUrl?: string };
      notify.error("OTP", err.message || "Could not send OTP");
      if (err.code === "ALREADY_REGISTERED" || /already registered/i.test(err.message)) {
        notify.info("Already registered", "Please login as seller");
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const confirmOtp = async () => {
    if (!otpType || otpCode.length < 4) {
      notify.error("OTP", "Enter the OTP");
      return;
    }
    setOtpLoading(true);
    try {
      await verifyOtp({ target: otpTarget, type: otpType, code: otpCode });
      if (otpType === "phone") setPhoneVerified(true);
      else setEmailVerified(true);
      setOtpType(null);
      notify.success("Verified", `${otpType} verified`);
    } catch (e) {
      notify.error("OTP", e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const submitStep1 = async () => {
    if (!phoneVerified || !emailVerified) {
      notify.error("Verify first", "Verify phone and email with OTP");
      return;
    }
    if (password.length < 8 || password !== confirmPassword) {
      notify.error("Password", "Min 8 chars, must match confirm password");
      return;
    }
    setLoading(true);
    try {
      const res = await registerSellerStep1({
        email: email.trim().toLowerCase(),
        phone: cleanedPhone,
        password,
        confirmPassword,
        emailVerified: true,
        phoneVerified: true,
      });
      setUserId(res.userId);
      setStep(2);
      notify.success("Step 1 done", "Add business details");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      notify.error("Register", msg);
      if (/already registered/i.test(msg)) {
        router.replace("/seller/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyGst = async () => {
    if (gstNumber.trim().length !== 15) {
      notify.error("GSTIN", "Enter 15-character GSTIN");
      return;
    }
    setGstBusy(true);
    try {
      const data = await verifySellerGst(gstNumber.trim().toUpperCase(), panNumber || undefined);
      if (!data.verified) {
        setGstVerified(false);
        notify.error("GST", data.error || "Verification failed");
        return;
      }
      setGstVerified(true);
      setGstLegalName(data.legalName || "");
      if (data.pan) setPanNumber(data.pan);
      notify.success("GST verified", data.legalName || "OK");
    } catch (e) {
      notify.error("GST", e instanceof Error ? e.message : "Failed");
    } finally {
      setGstBusy(false);
    }
  };

  const submitStep2 = async () => {
    if (!businessName.trim() || !pickupAddress.trim() || !city.trim() || !stateName.trim()) {
      notify.error("Required", "Fill business name, pickup, city and state");
      return;
    }
    if (pincode.trim().length !== 6) {
      notify.error("Pincode", "Enter valid 6-digit pincode");
      return;
    }
    if (gstNumber.trim() && !gstVerified) {
      notify.error("GST", "Verify GSTIN before continuing");
      return;
    }
    setLoading(true);
    try {
      await registerSellerStep2({
        userId,
        businessName: businessName.trim(),
        businessType,
        gstNumber: gstNumber.trim().toUpperCase() || "",
        gstVerified,
        gstLegalName,
        panNumber: panNumber.trim().toUpperCase() || "",
        pickupAddress: pickupAddress.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });
      notify.success("Registered", "Login with your mobile number");
      router.replace("/seller/login");
    } catch (e) {
      notify.error("Register", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Seller Register" />

      <View style={styles.stepper}>
        <Text style={[styles.stepLabel, step === 1 && styles.stepOn]}>1. Account</Text>
        <Text style={styles.stepSep}>→</Text>
        <Text style={[styles.stepLabel, step === 2 && styles.stepOn]}>2. Business</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 + bottom }]} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <>
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/\D/g, "").slice(0, 10));
                  setPhoneVerified(false);
                }}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10-digit mobile"
                placeholderTextColor={colors.muted}
              />
              <Pressable
                style={styles.otpBtn}
                onPress={() => sendOtp("phone")}
                disabled={otpLoading || phoneVerified}
              >
                <Text style={styles.otpBtnText}>{phoneVerified ? "✓ Verified" : "Send OTP"}</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Email *</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setEmailVerified(false);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="seller@business.com"
                placeholderTextColor={colors.muted}
              />
              <Pressable
                style={styles.otpBtn}
                onPress={() => sendOtp("email")}
                disabled={otpLoading || emailVerified}
              >
                <Text style={styles.otpBtnText}>{emailVerified ? "✓ Verified" : "Send OTP"}</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Create Password *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min 8 chars, upper+lower+number"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter password"
              placeholderTextColor={colors.muted}
            />

            <Pressable style={styles.btn} onPress={submitStep1} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Continue →</Text>
              )}
            </Pressable>
            <Pressable onPress={() => router.replace("/seller/login")}>
              <Text style={styles.link}>Already registered? Seller Login</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Your store / company name"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Business Type *</Text>
            <View style={styles.chips}>
              {BUSINESS_TYPES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setBusinessType(t.id)}
                  style={[styles.chip, businessType === t.id && styles.chipOn]}
                >
                  <Text style={[styles.chipText, businessType === t.id && styles.chipTextOn]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>GSTIN (optional)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={gstNumber}
                onChangeText={(t) => {
                  setGstNumber(t.toUpperCase());
                  setGstVerified(false);
                }}
                autoCapitalize="characters"
                maxLength={15}
                placeholder="15-char GSTIN"
                placeholderTextColor={colors.muted}
              />
              <Pressable style={styles.otpBtn} onPress={onVerifyGst} disabled={gstBusy}>
                <Text style={styles.otpBtnText}>
                  {gstVerified ? "✓ Verified" : gstBusy ? "…" : "Verify"}
                </Text>
              </Pressable>
            </View>
            {gstLegalName ? <Text style={styles.gstName}>{gstLegalName}</Text> : null}

            <Text style={styles.label}>PAN (optional)</Text>
            <TextInput
              style={styles.input}
              value={panNumber}
              onChangeText={(t) => setPanNumber(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
              placeholder="ABCDE1234F"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Pickup Address *</Text>
            <TextInput
              style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              multiline
              placeholder="Warehouse / pickup address"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              value={stateName}
              onChangeText={setStateName}
              placeholder="State"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={(t) => setPincode(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="6-digit pincode"
              placeholderTextColor={colors.muted}
            />

            <Pressable style={styles.btn} onPress={submitStep2} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Complete Registration</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal visible={!!otpType} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Verify {otpType}</Text>
            <Text style={styles.hint}>OTP sent to {otpTarget}</Text>
            {devOtp ? <Text style={styles.dev}>Dev OTP: {devOtp}</Text> : null}
            <TextInput
              style={styles.input}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter OTP"
              placeholderTextColor={colors.muted}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancel} onPress={() => setOtpType(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.save} onPress={confirmOtp} disabled={otpLoading}>
                {otpLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepLabel: { fontSize: 12, fontWeight: "700", color: colors.muted },
  stepOn: { color: colors.primary },
  stepSep: { color: colors.muted },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.foreground,
  },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  otpBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#faf5ff",
  },
  otpBtnText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  link: { marginTop: 16, textAlign: "center", color: colors.primary, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  chipTextOn: { color: "#fff" },
  gstName: { color: colors.success, fontSize: 12, marginTop: 6, fontWeight: "600" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  hint: { color: colors.muted, marginTop: 6, marginBottom: 8 },
  dev: { color: colors.primary, fontWeight: "700", marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { fontWeight: "700", color: colors.foreground },
  save: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
});
