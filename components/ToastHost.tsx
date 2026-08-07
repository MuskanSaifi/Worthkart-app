import Toast, {
  BaseToast,
  ErrorToast,
  type BaseToastProps,
  type ToastConfig,
} from "react-native-toast-message";
import { colors } from "@/constants/theme";

const baseStyle = {
  borderLeftWidth: 5,
  borderRadius: 12,
  height: undefined as unknown as number,
  minHeight: 56,
  paddingVertical: 10,
};

function SuccessToast(props: BaseToastProps) {
  return (
    <BaseToast
      {...props}
      style={{ ...baseStyle, borderLeftColor: colors.success }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontSize: 15, fontWeight: "800", color: colors.foreground }}
      text2Style={{ fontSize: 13, color: colors.muted }}
      text2NumberOfLines={3}
    />
  );
}

function ErrorToastStyled(props: BaseToastProps) {
  return (
    <ErrorToast
      {...props}
      style={{ ...baseStyle, borderLeftColor: colors.danger }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontSize: 15, fontWeight: "800", color: colors.foreground }}
      text2Style={{ fontSize: 13, color: colors.muted }}
      text2NumberOfLines={3}
    />
  );
}

function InfoToast(props: BaseToastProps) {
  return (
    <BaseToast
      {...props}
      style={{ ...baseStyle, borderLeftColor: colors.primary }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontSize: 15, fontWeight: "800", color: colors.foreground }}
      text2Style={{ fontSize: 13, color: colors.muted }}
      text2NumberOfLines={3}
    />
  );
}

export const toastConfig: ToastConfig = {
  success: SuccessToast,
  error: ErrorToastStyled,
  info: InfoToast,
};

export function ToastHost() {
  return <Toast config={toastConfig} topOffset={52} visibilityTime={3500} />;
}
