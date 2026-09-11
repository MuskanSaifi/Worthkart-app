import { Image } from "expo-image";
import { StyleSheet, type ImageStyle, type StyleProp } from "react-native";

/** Same mark as website `/logo.png` (220×80). */
const ASPECT = 220 / 80;

type Props = {
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ height = 40, style }: Props) {
  return (
    <Image
      source={require("@/assets/images/logo.png")}
      style={[styles.img, { height, width: Math.round(height * ASPECT) }, style]}
      contentFit="contain"
      accessibilityLabel="WorthKart"
    />
  );
}

const styles = StyleSheet.create({
  img: {
    maxWidth: 168,
  },
});
