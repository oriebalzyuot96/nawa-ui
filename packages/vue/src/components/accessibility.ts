// AccessibilityPanel for Vue: the shared Pelagic panel (markup and behavior from @pelagic-ui/core/a11y-prefs)
// with Vue props, v-model and events.
import { defineComponent, h, onBeforeUnmount, onMounted, readonly, ref, unref, watch, type PropType, type Ref } from 'vue';
import {
  THEME_CHANGE_EVENT,
  getThemeState,
  switchTheme as coreSwitchTheme,
  type SwitchThemeOptions,
  type ThemeChoice,
  type ThemeState,
  type ThemeSwitchOrigin,
} from '@pelagic-ui/core/theme';
import {
  mountA11yPanel,
  normalizeA11yPrefs,
  renderA11yPanelHTML,
  type A11yPanelChange,
  type A11yPanelController,
  type A11yPanelLabelOverrides,
  type A11yPrefs,
} from '@pelagic-ui/core/a11y-prefs';
import { nextId } from '../utils';

export type { A11yPrefs, A11yPanelChange, A11yPanelLabelOverrides } from '@pelagic-ui/core/a11y-prefs';
export {
  applyA11yPrefs,
  loadA11yPrefs,
  saveA11yPrefs,
  resetA11yPrefs,
  watchSystemPrefs,
  getSystemPrefs,
  defaultA11yPrefs,
  normalizeA11yPrefs,
} from '@pelagic-ui/core/a11y-prefs';
export { createTheme, applyCustomTheme, removeCustomTheme, themeToCode, switchTheme, getThemeState, onThemeChange, restoreTheme } from '@pelagic-ui/core/theme';
export type { CustomTheme, CreateThemeOptions, ThemeState, SwitchThemeOptions, ThemeSwitchOrigin, ThemePreset } from '@pelagic-ui/core/theme';

/**
 * The live theme of <html> (or `target`) and an animated switch (circular reveal from the clicked control).
 *
 *   const { theme, switchTheme } = useThemeSwitch();
 *   <button @click="(e) => switchTheme({ mode: theme.mode === 'dark' ? 'light' : 'dark' }, e)">Toggle</button>
 *
 * Reduced motion switches instantly. `theme` is read-only and follows every switchTheme() on the page.
 */
export function useThemeSwitch(target?: HTMLElement | Ref<HTMLElement | null | undefined> | null) {
  const theme = ref<ThemeState>(getThemeState(null));
  let el: HTMLElement | null = null;
  const sync = () => {
    if (el) theme.value = getThemeState(el);
  };
  onMounted(() => {
    el = unref(target) ?? document.documentElement;
    sync();
    el.addEventListener(THEME_CHANGE_EVENT, sync);
  });
  onBeforeUnmount(() => el?.removeEventListener(THEME_CHANGE_EVENT, sync));
  const switchTheme = (next: ThemeChoice, origin?: ThemeSwitchOrigin | Event, options?: Omit<SwitchThemeOptions, 'origin'>) =>
    coreSwitchTheme(next, { target: el ?? undefined, ...options, origin: origin as ThemeSwitchOrigin });
  return { theme: readonly(theme), switchTheme };
}

type GroupId = 'appearance' | 'color' | 'text' | 'reading' | 'motion' | 'interaction' | 'sound';

/**
 * Accessibility settings drawer: color schemes, color-vision filters, text size and spacing, reading
 * aids, motion and interaction aids. Changes apply live to <html> (or `target`), persist in localStorage
 * and are announced politely.
 *
 *   <AccessibilityPanel v-model="prefs" locale="ar" trigger="inline" @change="(prefs, change) => …" />
 */
export const AccessibilityPanel = defineComponent({
  name: 'PlAccessibilityPanel',
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
    /** Show the Theme group (mode, color theme, accent, own color, animated switch). Default true. */
    appearance: { type: Boolean, default: true },
    /** Sound group: 'auto' (once a sound engine exists), true or false. */
    sound: { type: [Boolean, String] as PropType<boolean | 'auto'>, default: 'auto' },
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
    const id = nextId('pl-a11y');
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
        appearance: props.appearance,
        sound: props.sound,
        prefs: props.modelValue,
      });
      ctl = mountA11yPanel(el.firstElementChild as HTMLElement, {
        target: () => props.target ?? undefined,
        persist: props.persist,
        sound: props.sound,
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
    watch(() => [props.locale, props.labels, props.trigger, props.triggerLabel, props.preview, props.groups, props.appearance, props.sound, props.persist], mount, { deep: true });
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
    return () => h('div', { ref: host, class: 'pl-a11y-host', style: 'display: contents' });
  },
});
