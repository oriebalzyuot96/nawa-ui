import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, space, useOrcaTheme } from '../theme';
import type { Variant } from './display';

export interface DialogProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children?: ReactNode;
  /** Tap the backdrop to close. Default true. */
  closeOnBackdrop?: boolean;
}

/** Centered modal. Android back button calls onClose. */
export function Dialog({ visible, title, onClose, footer, children, closeOnBackdrop = true }: DialogProps) {
  const t = useOrcaTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: t.overlay }]} onPress={closeOnBackdrop ? onClose : undefined} accessibilityLabel="Dismiss dialog">
        <Pressable style={[styles.dialog, { backgroundColor: t.surface }]} accessibilityRole="none" onPress={() => undefined}>
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <Text accessibilityRole="header" style={{ flex: 1, color: t.text, fontSize: fontSize.lg, fontWeight: '700' }}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8}>
              <Text style={{ color: t.textMuted, fontSize: 20 }}>×</Text>
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={[styles.footer, { borderTopColor: t.border }]}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export interface DrawerProps extends Omit<DialogProps, 'closeOnBackdrop'> {
  side?: 'left' | 'right';
}

/** Side sheet. */
export function Drawer({ visible, title, onClose, footer, children, side = 'right' }: DrawerProps) {
  const t = useOrcaTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: t.overlay, alignItems: side === 'right' ? 'flex-end' : 'flex-start', padding: 0 }]} onPress={onClose}>
        <Pressable style={[styles.drawer, { backgroundColor: t.surface }]} onPress={() => undefined}>
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <Text accessibilityRole="header" style={{ flex: 1, color: t.text, fontSize: fontSize.lg, fontWeight: '700' }}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8}>
              <Text style={{ color: t.textMuted, fontSize: 20 }}>×</Text>
            </Pressable>
          </View>
          <View style={[styles.body, { flex: 1 }]}>{children}</View>
          {footer ? <View style={[styles.footer, { borderTopColor: t.border }]}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export interface ToastItem {
  id: string | number;
  title?: string;
  message: string;
  variant?: Variant;
}

const toastColor = (t: ReturnType<typeof useOrcaTheme>, v?: Variant) =>
  v === 'success' ? t.success : v === 'warning' ? t.warning : v === 'danger' ? t.danger : t.info;

/** Stack of toasts pinned to the bottom. Render it last in your screen so it sits on top. */
export function Toast({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string | number) => void }) {
  const t = useOrcaTheme();
  if (items.length === 0) return null;
  return (
    <View pointerEvents="box-none" style={styles.stack} accessibilityLiveRegion="polite">
      {items.map((item) => (
        <View key={item.id} style={[styles.toast, { backgroundColor: t.surface, borderColor: t.border, borderLeftColor: toastColor(t, item.variant) }]}>
          <View style={{ flex: 1, gap: 2 }}>
            {item.title ? <Text style={{ color: t.text, fontWeight: '700', fontSize: fontSize.sm }}>{item.title}</Text> : null}
            <Text style={{ color: t.textMuted, fontSize: fontSize.sm }}>{item.message}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => onDismiss(item.id)} hitSlop={8}>
            <Text style={{ color: t.textMuted, fontSize: 18 }}>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: space.xl },
  dialog: { borderRadius: radius.lg, overflow: 'hidden', maxHeight: '85%' },
  drawer: { width: '82%', maxWidth: 420, height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  body: { padding: space.lg },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  stack: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl, gap: space.sm },
  toast: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, padding: space.md, borderWidth: 1, borderLeftWidth: 4, borderRadius: radius.md },
});
