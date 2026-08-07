import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import {
  TRACKING_STEPS,
  getTrackingHeadline,
  getTrackingStepIndex,
} from "@/lib/order-status";

const TRACK_TEAL = "#007185";

type Props = {
  status: string;
  estimatedDeliveryAt?: string | null;
  showHeadline?: boolean;
};

export function OrderTrackingProgress({
  status,
  estimatedDeliveryAt,
  showHeadline = true,
}: Props) {
  const isTerminal = status === "CANCELLED" || status === "RETURNED";
  const activeIndex = isTerminal ? -1 : getTrackingStepIndex(status);
  const headline = getTrackingHeadline(status, estimatedDeliveryAt);

  if (isTerminal) {
    return (
      <View style={styles.wrap}>
        {showHeadline ? <Text style={styles.headline}>{headline}</Text> : null}
        <Text style={styles.muted}>
          {status === "CANCELLED" ? "This order was cancelled." : "This order has been returned."}
        </Text>
      </View>
    );
  }

  if (status === "PENDING") {
    return (
      <View style={styles.wrap}>
        {showHeadline ? <Text style={[styles.headline, styles.pendingHeadline]}>{headline}</Text> : null}
        <Text style={styles.muted}>Complete payment to confirm your order.</Text>
      </View>
    );
  }

  const progress =
    TRACKING_STEPS.length > 1 ? activeIndex / (TRACKING_STEPS.length - 1) : 0;

  return (
    <View style={styles.wrap}>
      {showHeadline ? <Text style={styles.headline}>{headline}</Text> : null}
      <View style={styles.trackRow}>
        <View style={styles.lineBg} />
        <View style={[styles.lineFill, { width: `${Math.max(0, Math.min(100, progress * 100))}%` }]} />
        <View style={styles.steps}>
          {TRACKING_STEPS.map((step, index) => {
            const completed = index < activeIndex;
            const current = index === activeIndex;
            const done = completed || current;
            return (
              <View key={step.key} style={styles.stepCol}>
                <View
                  style={[
                    styles.dot,
                    done ? styles.dotActive : styles.dotUpcoming,
                  ]}
                >
                  {done ? <FontAwesome name="check" size={10} color="#fff" /> : null}
                </View>
                <Text style={[styles.stepLabel, done ? styles.stepLabelActive : styles.stepLabelMuted]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  headline: { fontSize: 15, fontWeight: "800", color: colors.foreground, marginBottom: 10 },
  pendingHeadline: { color: "#b45309" },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  trackRow: { position: "relative", paddingTop: 4, paddingHorizontal: 4, minHeight: 56 },
  lineBg: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 16,
    height: 3,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },
  lineFill: {
    position: "absolute",
    left: 20,
    top: 16,
    height: 3,
    backgroundColor: TRACK_TEAL,
    borderRadius: 2,
    maxWidth: "88%",
  },
  steps: { flexDirection: "row", justifyContent: "space-between" },
  stepCol: { flex: 1, alignItems: "center" },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    zIndex: 1,
  },
  dotActive: { backgroundColor: TRACK_TEAL, borderColor: TRACK_TEAL },
  dotUpcoming: { backgroundColor: colors.white, borderColor: "#d1d5db" },
  stepLabel: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  stepLabelActive: { color: colors.foreground, fontWeight: "600" },
  stepLabelMuted: { color: "#9ca3af" },
});
