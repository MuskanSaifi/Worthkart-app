import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SellerScreenHeader } from "@/components/SellerScreenHeader";
import { useSeller } from "@/context/SellerContext";
import { fetchSellerExtras, type SellerExtras } from "@/lib/seller-api";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

export default function SellerWarehouseScreen() {
  const { seller } = useSeller();
  const [profile, setProfile] = useState<SellerExtras["profile"] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      const data = await fetchSellerExtras(seller.token);
      setProfile(data.profile);
    } catch (e) {
      notify.error("Warehouse", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Warehouse" subtitle="Pickup & KYC details" />
      {loading && !profile ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Business</Text>
            <Row label="Name" value={profile?.businessName} />
            <Row label="Type" value={profile?.businessType || "—"} />
            <Row label="Status" value={profile?.status} />
            <Row label="Rating" value={String(profile?.rating ?? "—")} />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tax details</Text>
            <Row
              label="GST"
              value={
                profile?.gstNumber
                  ? `${profile.gstNumber}${profile.gstVerified ? " ✓" : ""}`
                  : "Not set"
              }
            />
            <Row
              label="PAN"
              value={
                profile?.panNumber
                  ? `${profile.panNumber}${profile.panVerified ? " ✓" : ""}`
                  : "Not set"
              }
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bank</Text>
            <Row label="Account" value={profile?.bankAccount || "Not set"} />
            <Row label="IFSC" value={profile?.bankIfsc || "—"} />
            <Row label="Bank" value={profile?.bankName || "—"} />
            <Row label="Verified" value={profile?.bankVerified ? "Yes" : "No"} />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pickup address</Text>
            <Text style={styles.addr}>
              {profile?.pickupAddress || "Not set"}
              {profile?.city ? `\n${profile.city}, ${profile.state} ${profile.pincode}` : ""}
            </Text>
          </View>
          <Text style={styles.hint}>
            Edit GST / PAN / bank OTP verification on website Warehouse for full KYC tools.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 12, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "800", color: colors.foreground, marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  label: { color: colors.muted, fontSize: 13 },
  value: { color: colors.foreground, fontWeight: "700", fontSize: 13, flexShrink: 1, textAlign: "right" },
  addr: { color: colors.foreground, lineHeight: 20 },
  hint: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 8 },
});
