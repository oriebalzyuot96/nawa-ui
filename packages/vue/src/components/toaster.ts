// Toaster for Vue: the shared Pelagic notification region (@pelagic-ui/core/toast) with Vue props.
// Render <Toaster /> once, then call toast() / toast.success() / toast.promise() from anywhere.
import { defineComponent, h, onBeforeUnmount, onMounted, watch, type PropType } from 'vue';
import { mountToaster, type MountToasterOptions, type ToasterController, type ToasterHotkey, type ToasterPosition, type ToastLabels } from '@pelagic-ui/core/toast';

export { toast, toastStore, TOAST_POSITIONS, TOAST_TYPES, TOAST_SWIPE_THRESHOLD } from '@pelagic-ui/core/toast';
export type { ToastOptions as ToasterToastOptions, ToastRecord, ToastId as ToasterToastId, ToastType, ToasterPosition, ToastApi, ToastAvatar } from '@pelagic-ui/core/toast';

/**
 * Notification region: spring enter and exit from its corner, a deck that fans out on hover or focus,
 * swipe to dismiss, a countdown that pauses on hover, focus and hidden tabs, animated icons, actions and
 * undo, a queue beyond `visibleToasts`, polite / assertive announcements and RTL. Fades only under reduced motion.
 *
 *   <Toaster position="top-center" progress close-button />
 *   toast.success('Saved', { description: 'All changes are live.', undo: () => restore() })
 */
export const Toaster = defineComponent({
  name: 'PlToaster',
  props: {
    position: { type: String as PropType<ToasterPosition>, default: 'bottom-end' },
    visibleToasts: { type: Number, default: 3 },
    duration: { type: Number, default: 4000 },
    gap: { type: Number, default: 12 },
    expand: { type: Boolean, default: false },
    richColors: { type: Boolean, default: false },
    closeButton: { type: Boolean, default: false },
    progress: { type: Boolean, default: false },
    hotkey: { type: [Object, Boolean] as PropType<ToasterHotkey | false>, default: undefined },
    hotkeyLabel: { type: String, default: undefined },
    locale: { type: String, default: undefined },
    labels: { type: Object as PropType<Partial<ToastLabels>>, default: undefined },
    dir: { type: String as PropType<'ltr' | 'rtl' | 'auto'>, default: undefined },
    className: { type: String, default: undefined },
  },
  setup(props) {
    let ctl: ToasterController | null = null;
    const options = (): MountToasterOptions => {
      const o: MountToasterOptions = { ...props } as MountToasterOptions;
      for (const k of Object.keys(o) as Array<keyof MountToasterOptions>) if (o[k] === undefined) delete o[k];
      return o;
    };
    onMounted(() => {
      ctl = mountToaster(options());
    });
    onBeforeUnmount(() => ctl?.destroy());
    watch(
      () => ({ ...props }),
      () => ctl?.update(options()),
      { deep: true },
    );
    // The region is portalled to <body>; nothing renders in place.
    return () => h('span', { hidden: true, 'data-pl-toaster-anchor': '' });
  },
});
