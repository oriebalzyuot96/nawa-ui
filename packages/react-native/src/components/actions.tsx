import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { fontSize, radius, space, usePelagicTheme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

const heights: Record<ButtonSize, number> = { sm: 32, md: 40, lg: 48 };
const fonts: Record<ButtonSize, number> = { sm: fontSize.sm, md: fontSize.md, lg: fontSize.lg };

export function Button({ title, variant = 'primary', size = 'md', loading = false, block = false, disabled, style, ...rest }: ButtonProps) {
  const t = usePelagicTheme();
  const palette = {
    primary: { bg: t.primary, fg: t.onPrimary, border: 'transparent' },
    secondary: { bg: t.surfaceAlt, fg: t.text, border: t.border },
    outline: { bg: 'transparent', fg: t.primaryInk, border: t.primary },
    ghost: { bg: 'transparent', fg: t.text, border: 'transparent' },
    danger: { bg: t.danger, fg: t.onDanger, border: 'transparent' },
  }[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          paddingHorizontal: size === 'lg' ? space.xl : space.lg,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: radius.md,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: block ? 'stretch' : 'flex-start',
        },
        style as ViewStyle,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={palette.fg} style={styles.spinner} /> : null}
      <Text style={{ color: palette.fg, fontSize: fonts[size], fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1,
  },
  spinner: { marginRight: space.xs },
});
