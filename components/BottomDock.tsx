import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/constants/theme";
import { useBottomInset } from "@/lib/safe-layout";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Sticky action bar that stays above the Android system nav / iOS home indicator. */
export function BottomDock({ children, style }: Props) {
  const bottom = useBottomInset();
  return (
    <View style={[styles.dock, { paddingBottom: 12 + bottom }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
});
