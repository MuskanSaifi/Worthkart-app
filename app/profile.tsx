import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { useBottomInset } from "@/lib/safe-layout";

export default function ProfileScreen() {
  const router = useRouter();
  const bottom = useBottomInset();
  const { isLoggedIn, ready, user, login, logout } = useAuth();
  const confirm = useConfirm();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace("/login?returnTo=profile");
    }
  }, [ready, isLoggedIn, router]);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await login({
        ...user,
        name: name.trim() || null,
        loggedInAt: user.loggedInAt,
      });
      notify.success("Profile updated");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !isLoggedIn || !user) {
    return (
      <View style={styles.page}>
        <AppHeader showBack showSearch={false} title="My Profile" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="My Profile" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + bottom }]}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={32} color={colors.primary} />
          </View>
          <Text style={styles.phone}>{user.phone}</Text>
          <Text style={styles.badge}>Buyer account · OTP verified</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.readonly}>
            <Text style={styles.readonlyText}>{user.phone}</Text>
            <Text style={styles.locked}>Verified</Text>
          </View>

          <Text style={styles.hint}>
            Mobile number login se linked hai. Name save karke checkout pe use ho sakta hai.
          </Text>

          <Pressable style={styles.saveBtn} onPress={onSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveText}>Save profile</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            const ok = await confirm("You will need OTP again next time.", {
              title: "Logout?",
              confirmLabel: "Logout",
              destructive: true,
            });
            if (!ok) return;
            await logout();
            router.replace("/(tabs)/account");
          }}
        >
          <FontAwesome name="sign-out" size={14} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 24,
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  phone: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
  },
  badge: {
    marginTop: 6,
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.background,
    marginBottom: 14,
  },
  readonly: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    marginBottom: 10,
  },
  readonlyText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
  },
  locked: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 14,
  },
  logoutBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutText: {
    color: colors.danger,
    fontWeight: "800",
  },
});
