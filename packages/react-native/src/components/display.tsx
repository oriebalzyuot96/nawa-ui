import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { fontSize, radius, space, useNawaTheme, useReducedMotion } from '../theme';
import { initialsOf } from '../utils';

export type Variant = 'info' | 'success' | 'warning' | 'danger';

function variantColors(t: ReturnType<typeof useNawaTheme>, variant: Variant | 'primary' | 'neutral') {
  switch (variant) {
    case 'success':
      return { fg: t.success, bg: t.successSoft };
    case 'warning':
      return { fg: t.warning, bg: t.warningSoft };
    case 'danger':
      return { fg: t.danger, bg: t.dangerSoft };
    case 'info':
      return { fg: t.info, bg: t.infoSoft };
    case 'primary':
      return { fg: t.primaryInk, bg: t.primarySoft };
    default:
      return { fg: t.text, bg: t.surfaceMuted };
  }
}

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: 'neutral' | 'primary' | Variant }) {
  const t = useNawaTheme();
  const c = variantColors(t, variant);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={{ color: c.fg, fontSize: fontSize.xs, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

export function Tag({ children, removable = false, onRemove }: { children: ReactNode; removable?: boolean; onRemove?: () => void }) {
  const t = useNawaTheme();
  return (
    <View style={[styles.tag, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}>
      <Text style={{ color: t.text, fontSize: fontSize.sm }}>{children}</Text>
      {removable ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Remove" onPress={onRemove} hitSlop={8}>
          <Text style={{ color: t.textMuted, fontSize: 16 }}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Avatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const t = useNawaTheme();
  const dim = size === 'sm' ? 32 : size === 'lg' ? 56 : 40;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: t.primarySoft }]}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: dim, height: dim, borderRadius: dim / 2 }} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={{ color: t.primaryInk, fontWeight: '600', fontSize: dim * 0.38 }}>{initialsOf(name)}</Text>
      )}
    </View>
  );
}

export function Card({ title, footer, children }: { title?: ReactNode; footer?: ReactNode; children?: ReactNode }) {
  const t = useNawaTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {title ? <View style={[styles.cardHeader, { borderBottomColor: t.border }]}><Text style={{ color: t.text, fontWeight: '700', fontSize: fontSize.md }}>{title}</Text></View> : null}
      {children ? <View style={styles.cardBody}>{children}</View> : null}
      {footer ? <View style={[styles.cardFooter, { borderTopColor: t.border, backgroundColor: t.surfaceAlt }]}>{footer}</View> : null}
    </View>
  );
}

export function Spinner({ size = 'md', color }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const t = useNawaTheme();
  return <ActivityIndicator size={size === 'lg' ? 'large' : 'small'} color={color ?? t.primary} accessibilityLabel="Loading" />;
}

export function Skeleton({ width = '100%', height = 14, circle = false }: { width?: DimensionValue; height?: number; circle?: boolean }) {
  const t = useNawaTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: circle ? height : width,
        height,
        borderRadius: circle ? height / 2 : radius.sm,
        backgroundColor: t.surfaceMuted,
        opacity,
      }}
    />
  );
}

/** Paragraph placeholder, announced once as "Loading". The last line is shorter. */
export function SkeletonText({ lines = 3, label = 'Loading' }: { lines?: number; label?: string }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} style={{ gap: space.sm }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}

/** Card placeholder: avatar, title lines and a body paragraph. */
export function SkeletonCard({ lines = 3, label = 'Loading' }: { lines?: number; label?: string }) {
  const t = useNawaTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, padding: space.lg, gap: space.lg }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Skeleton circle height={40} />
        <View style={{ flex: 1, gap: space.sm }}>
          <Skeleton height={12} width="50%" />
          <Skeleton height={10} width="30%" />
        </View>
      </View>
      <View style={{ gap: space.sm }}>
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} height={12} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} />
        ))}
      </View>
    </View>
  );
}

export function ProgressBar({ value, label = 'Progress' }: { value?: number; label?: string }) {
  const t = useNawaTheme();
  const indeterminate = value === undefined;
  const pct = indeterminate ? 40 : Math.min(100, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={indeterminate ? undefined : { min: 0, max: 100, now: pct }}
      style={[styles.progress, { backgroundColor: t.surfaceMuted }]}
    >
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: t.primary, borderRadius: radius.pill }} />
    </View>
  );
}

export function Stepper({ steps, current }: { steps: { label: string; description?: string }[]; current: number }) {
  const t = useNawaTheme();
  return (
    <View style={styles.stepper} accessibilityRole="progressbar" accessibilityLabel={`Step ${current + 1} of ${steps.length}`}>
      {steps.map((s, i) => {
        const active = i <= current;
        return (
          <View key={i} style={[styles.step, { borderTopColor: active ? t.primary : t.border }]}>
            <Text style={{ color: i === current ? t.primaryInk : active ? t.text : t.textMuted, fontWeight: i === current ? '700' : '500', fontSize: fontSize.sm }}>
              {s.label}
            </Text>
            {s.description ? <Text style={{ color: t.textMuted, fontSize: fontSize.xs }}>{s.description}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

export interface TimelineItem {
  title: string;
  description?: string;
  time?: string;
  variant?: 'primary' | Variant;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  const t = useNawaTheme();
  return (
    <View>
      {items.map((item, i) => {
        const c = variantColors(t, item.variant ?? 'primary');
        return (
          <View key={i} style={[styles.timelineItem, { borderLeftColor: i === items.length - 1 ? 'transparent' : t.border }]}>
            <View style={[styles.timelineDot, { backgroundColor: c.fg }]} />
            {item.time ? <Text style={{ color: t.textMuted, fontSize: fontSize.xs }}>{item.time}</Text> : null}
            <Text style={{ color: t.text, fontWeight: '600', fontSize: fontSize.md }}>{item.title}</Text>
            {item.description ? <Text style={{ color: t.textMuted, fontSize: fontSize.sm }}>{item.description}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

export function Alert({ variant = 'info', title, children, onClose }: { variant?: Variant; title?: ReactNode; children?: ReactNode; onClose?: () => void }) {
  const t = useNawaTheme();
  const c = variantColors(t, variant);
  return (
    <View accessibilityRole="alert" style={[styles.alert, { backgroundColor: c.bg, borderColor: c.fg }]}>
      <View style={{ flex: 1, gap: 2 }}>
        {title ? <Text style={{ color: t.text, fontWeight: '700', fontSize: fontSize.md }}>{title}</Text> : null}
        {typeof children === 'string' ? <Text style={{ color: t.text, fontSize: fontSize.sm }}>{children}</Text> : children}
      </View>
      {onClose ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={onClose} hitSlop={8}>
          <Text style={{ color: t.textMuted, fontSize: 18 }}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, description, children }: { icon?: ReactNode; title: string; description?: string; children?: ReactNode }) {
  const t = useNawaTheme();
  return (
    <View style={styles.empty}>
      {icon ? <View>{icon}</View> : null}
      <Text style={{ color: t.text, fontWeight: '700', fontSize: fontSize.lg, textAlign: 'center' }}>{title}</Text>
      {description ? <Text style={{ color: t.textMuted, fontSize: fontSize.sm, textAlign: 'center' }}>{description}</Text> : null}
      {children ? <View style={{ marginTop: space.sm }}>{children}</View> : null}
    </View>
  );
}

export function Divider() {
  const t = useNawaTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, alignSelf: 'stretch' }} />;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill },
  tag: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm, paddingVertical: space.xs, borderWidth: 1, borderRadius: radius.sm, alignSelf: 'flex-start' },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  card: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  cardHeader: { padding: space.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  cardBody: { padding: space.lg },
  cardFooter: { padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  progress: { width: '100%', height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  stepper: { flexDirection: 'row', gap: space.sm },
  step: { flex: 1, borderTopWidth: 3, paddingTop: space.sm, gap: 2 },
  timelineItem: { paddingLeft: space.lg, paddingBottom: space.lg, borderLeftWidth: 2, marginLeft: space.xs, gap: 2 },
  timelineDot: { position: 'absolute', left: -6, top: 4, width: 10, height: 10, borderRadius: 5 },
  alert: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, padding: space.md, borderWidth: 1, borderRadius: radius.md },
  empty: { alignItems: 'center', gap: space.sm, padding: space.xl },
});
