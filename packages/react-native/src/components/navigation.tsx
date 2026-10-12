import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, space, useNawaTheme } from '../theme';
import { getPageItems } from '../utils';

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
  content?: ReactNode;
}

export function Tabs({ tabs, value, defaultValue, onChange }: { tabs: TabItem[]; value?: string; defaultValue?: string; onChange?: (key: string) => void }) {
  const t = useNawaTheme();
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.key);
  const active = value ?? inner;
  const select = (key: string) => {
    if (value === undefined) setInner(key);
    onChange?.(key);
  };
  const activeTab = tabs.find((tab) => tab.key === active);
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: tab.disabled }}
              disabled={tab.disabled}
              onPress={() => select(tab.key)}
              style={[styles.tab, selected && { borderBottomColor: t.primary, borderBottomWidth: 2 }]}
            >
              <Text style={{ color: selected ? t.primaryInk : t.textMuted, fontWeight: '600', fontSize: fontSize.md }}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {activeTab?.content ? <View style={{ paddingVertical: space.md }}>{activeTab.content}</View> : null}
    </View>
  );
}

export function Breadcrumb({ items }: { items: { label: string; onPress?: () => void }[] }) {
  const t = useNawaTheme();
  return (
    <View accessibilityRole="menubar" style={styles.breadcrumb}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <View key={i} style={styles.crumb}>
            {i > 0 ? <Text style={{ color: t.controlBorder }}>/</Text> : null}
            <Pressable disabled={last || !item.onPress} onPress={item.onPress} accessibilityState={{ selected: last }}>
              <Text style={{ color: last ? t.text : t.primaryInk, fontWeight: last ? '700' : '500', fontSize: fontSize.sm }}>{item.label}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export function Pagination({ value, pageCount, onChange }: { value: number; pageCount: number; onChange: (page: number) => void }) {
  const t = useNawaTheme();
  const btn = (label: string, page: number, disabled: boolean, selected = false, a11y?: string) => (
    <Pressable
      key={`${label}-${page}`}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? `Page ${label}`}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={() => onChange(page)}
      style={[styles.pageBtn, selected && { backgroundColor: t.primary }]}
    >
      <Text style={{ color: selected ? t.onPrimary : t.text, fontWeight: '600', opacity: disabled ? 0.4 : 1 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.pagination}>
      {btn('‹', value - 1, value <= 1, false, 'Previous page')}
      {getPageItems(value, pageCount).map((item, i) =>
        item === 'ellipsis' ? (
          <Text key={`e${i}`} style={{ color: t.textMuted, paddingHorizontal: 4 }}>…</Text>
        ) : (
          btn(String(item), item, false, item === value)
        ),
      )}
      {btn('›', value + 1, value >= pageCount, false, 'Next page')}
    </View>
  );
}

export interface AccordionItem {
  key: string;
  title: string;
  content: ReactNode;
}

export function Accordion({ items, multiple = false, defaultOpen = [] }: { items: AccordionItem[]; multiple?: boolean; defaultOpen?: string[] }) {
  const t = useNawaTheme();
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const toggle = (key: string) =>
    setOpen((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : multiple ? [...prev, key] : [key]));
  return (
    <View style={[styles.accordion, { borderColor: t.border, backgroundColor: t.surface }]}>
      {items.map((item, i) => {
        const expanded = open.includes(item.key);
        return (
          <View key={item.key} style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border } : undefined}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => toggle(item.key)} style={styles.accordionHead}>
              <Text style={{ flex: 1, color: t.text, fontWeight: '600', fontSize: fontSize.md }}>{item.title}</Text>
              <Text style={{ color: t.textMuted }}>{expanded ? '▴' : '▾'}</Text>
            </Pressable>
            {expanded ? <View style={styles.accordionBody}>{item.content}</View> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { paddingVertical: space.md, paddingHorizontal: space.md },
  breadcrumb: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  pageBtn: { minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingHorizontal: space.sm },
  accordion: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  accordionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.lg },
  accordionBody: { paddingHorizontal: space.lg, paddingBottom: space.lg },
});
