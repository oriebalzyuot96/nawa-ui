import { defineComponent, h, nextTick, onBeforeUnmount, ref, Teleport, watch, type PropType } from 'vue';
import { lockScroll, trapFocus } from '@nawa-ui/core/a11y';
import { nextId } from '../utils';
import type { Variant } from './display';

/**
 * Shared modal behavior for Dialog and Drawer: Escape closes, focus moves into the panel
 * and is trapped there, the page behind does not scroll, and focus returns on close.
 */
function useOverlay(props: { open: boolean }, emitClose: () => void, panel: { value: HTMLElement | null }) {
  let previous: HTMLElement | null = null;
  let release: Array<() => void> = [];
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') emitClose();
  };
  const teardown = () => {
    document.removeEventListener('keydown', onKey);
    release.forEach((fn) => fn());
    release = [];
  };
  watch(
    () => props.open,
    (open) => {
      if (open) {
        previous = document.activeElement as HTMLElement | null;
        document.addEventListener('keydown', onKey);
        release.push(lockScroll());
        nextTick(() => {
          if (!panel.value) return;
          panel.value.focus();
          release.push(trapFocus(panel.value));
        });
      } else {
        teardown();
        previous?.focus?.();
        previous = null;
      }
    },
    { immediate: true },
  );
  onBeforeUnmount(teardown);
}

const overlayProps = {
  open: { type: Boolean, required: true },
  title: { type: String, required: true },
  /** Close when the backdrop is clicked. Default true. */
  closeOnBackdrop: { type: Boolean, default: true },
};

export const Dialog = defineComponent({
  name: 'NwDialog',
  props: {
    ...overlayProps,
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
  },
  emits: ['close'],
  setup(props, { emit, slots }) {
    const panel = ref<HTMLElement | null>(null);
    const titleId = nextId('nw-dialog-title');
    useOverlay(props, () => emit('close'), panel);

    return () => {
      if (!props.open || typeof document === 'undefined') return null;
      return h(Teleport, { to: 'body' }, [
        h(
          'div',
          {
            class: 'nw-overlay',
            onMousedown: (e: MouseEvent) => {
              if (props.closeOnBackdrop && e.target === e.currentTarget) emit('close');
            },
          },
          [
            h(
              'div',
              {
                ref: panel,
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': titleId,
                tabindex: -1,
                class: ['nw-dialog', props.size !== 'md' && `nw-dialog--${props.size}`],
              },
              [
                h('header', { class: 'nw-dialog__header' }, [
                  h('h2', { id: titleId, class: 'nw-dialog__title' }, props.title),
                  h('button', { type: 'button', class: 'nw-close', 'aria-label': 'Close', onClick: () => emit('close') }, '×'),
                ]),
                h('div', { class: 'nw-dialog__body' }, slots.default?.()),
                slots.footer ? h('footer', { class: 'nw-dialog__footer' }, slots.footer()) : null,
              ],
            ),
          ],
        ),
      ]);
    };
  },
});

export const Drawer = defineComponent({
  name: 'NwDrawer',
  props: {
    ...overlayProps,
    side: { type: String as PropType<'left' | 'right'>, default: 'right' },
  },
  emits: ['close'],
  setup(props, { emit, slots }) {
    const panel = ref<HTMLElement | null>(null);
    const titleId = nextId('nw-drawer-title');
    useOverlay(props, () => emit('close'), panel);

    return () => {
      if (!props.open || typeof document === 'undefined') return null;
      return h(Teleport, { to: 'body' }, [
        h(
          'div',
          {
            class: ['nw-overlay', 'nw-overlay--drawer', props.side === 'right' && 'nw-overlay--right'],
            onMousedown: (e: MouseEvent) => {
              if (props.closeOnBackdrop && e.target === e.currentTarget) emit('close');
            },
          },
          [
            h(
              'div',
              {
                ref: panel,
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': titleId,
                tabindex: -1,
                class: ['nw-drawer', props.side === 'right' && 'nw-drawer--right'],
              },
              [
                h('header', { class: 'nw-dialog__header' }, [
                  h('h2', { id: titleId, class: 'nw-dialog__title' }, props.title),
                  h('button', { type: 'button', class: 'nw-close', 'aria-label': 'Close', onClick: () => emit('close') }, '×'),
                ]),
                h('div', { class: 'nw-dialog__body' }, slots.default?.()),
                slots.footer ? h('footer', { class: 'nw-dialog__footer' }, slots.footer()) : null,
              ],
            ),
          ],
        ),
      ]);
    };
  },
});

export interface ToastItem {
  id: string | number;
  title?: string;
  message: string;
  variant?: Variant;
}

/** Presentational toast stack. Keep the items list in your state and remove on `dismiss`. */
export const Toast = defineComponent({
  name: 'NwToast',
  props: {
    items: { type: Array as PropType<ToastItem[]>, required: true },
  },
  emits: ['dismiss'],
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        { role: 'status', 'aria-live': 'polite', class: 'nw-toast-stack' },
        props.items.map((t) =>
          h('div', { key: t.id, class: ['nw-toast', t.variant && t.variant !== 'info' && `nw-toast--${t.variant}`] }, [
            h('div', { class: 'nw-toast__body' }, [
              t.title ? h('div', { class: 'nw-toast__title' }, t.title) : null,
              h('div', { class: 'nw-toast__message' }, t.message),
            ]),
            h(
              'button',
              { type: 'button', class: 'nw-close', 'aria-label': 'Dismiss', onClick: () => emit('dismiss', t.id) },
              '×',
            ),
          ]),
        ),
      );
  },
});
