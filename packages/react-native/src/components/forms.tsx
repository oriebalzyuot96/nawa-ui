import { useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch as RNSwitch,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { fontSize, radius, space, useOrcaTheme } from '../theme';

export interface FieldMetaProps {
  label?: string;
  hint?: string;
  error?: string;
}

function FieldFrame({ label, hint, error, children }: FieldMetaProps & { children: ReactNode }) {
  const t = useOrcaTheme();
  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, { color: t.text }]}>{label}</Text> : null}
      {children}
      {error ? <Text style={[styles.error, { color: t.danger }]}>{error}</Text> : hint ? <Text style={[styles.hint, { color: t.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

export interface InputProps extends TextInputProps, FieldMetaProps {}

export function Input({ label, hint, error, style, multiline, ...rest }: InputProps) {
  const t = useOrcaTheme();
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <TextInput
        accessibilityLabel={label}
        // Error (or hint) is read when the field is focused (WCAG 3.3.1).
        accessibilityHint={error ?? hint}
        placeholderTextColor={t.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          { color: t.text, backgroundColor: t.surface, borderColor: error ? t.danger : t.controlBorder },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
    </FieldFrame>
  );
}

export function Textarea(props: InputProps) {
  return <Input {...props} multiline numberOfLines={props.numberOfLines ?? 4} textAlignVertical="top" />;
}

export interface SelectOption {
  label: string;
  value: string;
}

/** Bottom-sheet style picker. Use it where the web uses a dropdown. */
export function Select({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select…',
}: FieldMetaProps & { options: SelectOption[]; value?: string; onChange: (value: string) => void; placeholder?: string }) {
  const t = useOrcaTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label ?? placeholder}
        onPress={() => setOpen(true)}
        style={[styles.input, { backgroundColor: t.surface, borderColor: error ? t.danger : t.controlBorder, justifyContent: 'center' }]}
      >
        <Text style={{ color: selected ? t.text : t.textMuted, fontSize: fontSize.md }}>{selected?.label ?? placeholder}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: t.surface }]}>
            {options.map((o) => (
              <Pressable
                key={o.value}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: o.value === value }}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={styles.option}
              >
                <Text style={{ color: o.value === value ? t.primaryInk : t.text, fontWeight: o.value === value ? '700' : '400', fontSize: fontSize.md }}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </FieldFrame>
  );
}

export function Checkbox({ label, checked, onChange, disabled }: { label?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  const t = useOrcaTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.row, disabled && { opacity: 0.55 }]}
    >
      <View style={[styles.box, { borderColor: checked ? t.primary : t.controlBorder, backgroundColor: checked ? t.primary : 'transparent' }]}>
        {checked ? <Text style={{ color: t.onPrimary, fontSize: 12, fontWeight: '700' }}>✓</Text> : null}
      </View>
      {label ? <Text style={{ color: t.text, fontSize: fontSize.md }}>{label}</Text> : null}
    </Pressable>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  const t = useOrcaTheme();
  return (
    <View style={styles.rowBetween}>
      <Text style={{ color: t.text, fontSize: fontSize.md, flex: 1 }}>{label}</Text>
      <RNSwitch
        accessibilityLabel={label}
        value={checked}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: t.controlBorder, true: t.primary }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export function RadioGroup({ options, value, onChange, label }: { options: RadioOption[]; value?: string; onChange: (value: string) => void; label?: string }) {
  const t = useOrcaTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: space.sm }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: o.disabled }}
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            style={[styles.row, o.disabled && { opacity: 0.55 }]}
          >
            <View style={[styles.radio, { borderColor: selected ? t.primary : t.controlBorder }]}>
              {selected ? <View style={[styles.radioDot, { backgroundColor: t.primary }]} /> : null}
            </View>
            <Text style={{ color: t.text, fontSize: fontSize.md }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Segmented({ options, value, onChange, label }: { options: { label: string; value: string }[]; value: string; onChange: (value: string) => void; label?: string }) {
  const t = useOrcaTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.segmented, { backgroundColor: t.surfaceMuted }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && { backgroundColor: t.surface }]}
          >
            <Text style={{ color: selected ? t.text : t.textMuted, fontWeight: '600', fontSize: fontSize.sm }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  label: { fontSize: fontSize.sm, fontWeight: '600' },
  hint: { fontSize: fontSize.sm },
  error: { fontSize: fontSize.sm },
  input: {
    minHeight: 44,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    fontSize: fontSize.md,
  },
  multiline: { minHeight: 96 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: space.xl },
  sheet: { borderRadius: radius.lg, padding: space.sm },
  option: { paddingVertical: space.md, paddingHorizontal: space.lg },
  segmented: { flexDirection: 'row', padding: 3, borderRadius: radius.md, gap: 3 },
  segment: { flex: 1, paddingVertical: space.sm, alignItems: 'center', borderRadius: radius.sm },
});
