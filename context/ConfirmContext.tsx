import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmContextValue = {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Please confirm");
  const [confirmLabel, setConfirmLabel] = useState("Confirm");
  const [cancelLabel, setCancelLabel] = useState("Cancel");
  const [destructive, setDestructive] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const finish = useCallback((result: boolean) => {
    setVisible(false);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  const confirm = useCallback((msg: string, options?: ConfirmOptions) => {
    setMessage(msg);
    setTitle(options?.title ?? "Please confirm");
    setConfirmLabel(options?.confirmLabel ?? "Confirm");
    setCancelLabel(options?.cancelLabel ?? "Cancel");
    setDestructive(options?.destructive ?? false);
    setVisible(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => finish(false)}>
        <Pressable style={styles.backdrop} onPress={() => finish(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={() => finish(false)}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, destructive && styles.confirmBtnDanger]}
                onPress={() => finish(true)}
              >
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  message: { marginTop: 10, fontSize: 14, color: colors.muted, lineHeight: 20 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 20 },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { fontWeight: "700", color: colors.foreground },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  confirmBtnDanger: { backgroundColor: colors.danger },
  confirmText: { fontWeight: "800", color: colors.white },
});
