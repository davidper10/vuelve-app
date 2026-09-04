import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export function ConfirmProvider({ children }: PropsWithChildren) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | undefined>(undefined);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const respond = (value: boolean) => {
    setOptions(null);
    resolver.current?.(value);
    resolver.current = undefined;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal visible={!!options} transparent animationType="fade" onRequestClose={() => respond(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{options?.title}</Text>
            <Text style={styles.message}>{options?.message}</Text>
            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={() => respond(false)}>
                <Text style={styles.cancelBtnText}>{options?.cancelLabel ?? 'Cancelar'}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, options?.destructive && styles.confirmBtnDestructive]}
                onPress={() => respond(true)}
              >
                <Text style={styles.confirmBtnText}>{options?.confirmLabel ?? 'Confirmar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(20,12,14,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  message: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink70, lineHeight: 20, marginBottom: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, color: colors.ink70, fontSize: 14 },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
  },
  confirmBtnDestructive: { backgroundColor: colors.terracotta },
  confirmBtnText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14 },
});
