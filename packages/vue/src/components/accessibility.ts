// AccessibilityPanel for Vue: the shared Orca panel (markup and behavior from @orca-ui/core/a11y-prefs)
// with Vue props, v-model and events.
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import {
  mountA11yPanel,
  normalizeA11yPrefs,
  renderA11yPanelHTML,
  type A11yPanelChange,
  type A11yPanelController,
  type A11yPanelLabelOverrides,
  type A11yPrefs,
} from '@orca-ui/core/a11y-prefs';
import { nextId } from '../utils';

export type { A11yPrefs, A11yPanelChange, A11yPanelLabelOverrides } from '@orca-ui/core/a11y-prefs';
export {
  applyA11yPrefs,
  loadA11yPrefs,
  saveA11yPrefs,
  resetA11yPrefs,
  watchSystemPrefs,
  getSystemPrefs,
  defaultA11yPrefs,
  normalizeA11yPrefs,
} from '@orca-ui/core/a11y-prefs';
export { createTheme, applyCustomTheme, removeCustomTheme, themeToCode } from '@orca-ui/core/theme';
export type { CustomTheme, CreateThemeOptions } from '@orca-ui/core/theme';

type GroupId = 'color' | 'text' | 'reading' | 'motion' | 'interaction';

/**
 * Accessibility settings drawer: color schemes, color-vision filters, text size and spacing, reading
 * aids, motion and interaction aids. Changes apply live to <html> (or `target`), persist in localStorage
 * and are announced politely.
 *
 *   <AccessibilityPanel v-model="prefs" locale="ar" trigger="inline" @change="(prefs, change) => …" />
 */
export const AccessibilityPanel = defineComponent({
  name: 'OcAccessibilityPanel',
  props: {
    /** v-model: the preferences (optional; the panel keeps its own state when omitted). */
    modelValue: { type: Object as PropType<Partial<A11yPrefs>>, default: undefined },
    /** v-model:open */
    open: { type: Boolean, default: undefined },
    trigger: { type: String as PropType<'floating' | 'inline' | 'none'>, default: 'floating' },
    triggerLabel: { type: String, default: undefined },
    locale: { type: String, default: undefined },
    labels: { type: Object as PropType<A11yPanelLabelOverrides>, default: undefined },
    preview: { type: Boolean, default: true },
    groups: { type: Array as PropType<GroupId[]>, default: undefined },
    /** localStorage key, true (default key) or false. */
    persist: { type: [Boolean, String] as PropType<boolean | string>, default: true },
    /** Element that receives the data-a11y-* attributes. Default <html>. */
    target: { type: Object as PropType<HTMLElement | null>, default: undefined },
  },
  emits: {
    'update:modelValue': (_prefs: A11yPrefs) => true,
    'update:open': (_open: boolean) => true,
    change: (_prefs: A11yPrefs, _change: A11yPanelChange) => true,
  },
  setup(props, { emit, expose }) {
    const host = ref<HTMLElement | null>(null);
    const id = nextId('oc-a11y');
    let ctl: A11yPanelController | null = null;

    const mount = () => {
      const el = host.value;
      if (!el) return;
      ctl?.destroy();
      el.innerHTML = renderA11yPanelHTML({
        id,
        locale: props.locale,
        labels: props.labels,
        trigger: props.trigger,
        triggerLabel: props.triggerLabel,
        preview: props.preview,
        groups: props.groups,
        prefs: props.modelValue,
      });
      ctl = mountA11yPanel(el.firstElementChild as HTMLElement, {
        target: () => props.target ?? undefined,
        persist: props.persist,
        value: props.modelValue,
        onChange: (prefs, change) => {
          emit('update:modelValue', prefs);
          emit('change', prefs, change);
        },
        onOpenChange: (open) => emit('update:open', open),
      });
      if (props.open) ctl.open();
    };

    onMounted(mount);
    onBeforeUnmount(() => ctl?.destroy());
    watch(() => [props.locale, props.labels, props.trigger, props.triggerLabel, props.preview, props.groups, props.persist], mount, { deep: true });
    watch(
      () => props.open,
      (open) => {
        if (open === undefined || !ctl) return;
        if (open) ctl.open();
        else ctl.close();
      },
    );
    watch(
      () => props.modelValue,
      (value) => {
        if (!ctl || !value) return;
        const next = normalizeA11yPrefs(value);
        if (JSON.stringify(next) !== JSON.stringify(ctl.get())) ctl.setAll(next);
      },
      { deep: true },
    );
    watch(() => props.target, () => ctl?.setAll(ctl.get()));

    expose({
      open: () => ctl?.open(),
      close: () => ctl?.close(),
      reset: () => ctl?.reset(),
      get: () => ctl?.get(),
    });
    return () => h('div', { ref: host, class: 'oc-a11y-host', style: 'display: contents' });
  },
});
