import { defineComponent, h, type PropType } from 'vue';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const Button = defineComponent({
  name: 'OcButton',
  props: {
    variant: { type: String as PropType<ButtonVariant>, default: 'primary' },
    size: { type: String as PropType<ButtonSize>, default: 'md' },
    /** Shows a spinner and disables the button. */
    loading: Boolean,
    block: Boolean,
    /** Square button for a single icon. Pass aria-label. */
    iconOnly: Boolean,
    type: { type: String as PropType<'button' | 'submit' | 'reset'>, default: 'button' },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'button',
        {
          type: props.type,
          class: [
            'oc-btn',
            `oc-btn--${props.variant}`,
            props.size !== 'md' && `oc-btn--${props.size}`,
            props.block && 'oc-btn--block',
            props.iconOnly && 'oc-btn--icon',
          ],
          disabled: props.loading,
          'aria-busy': props.loading ? 'true' : undefined,
        },
        [props.loading ? h('span', { class: 'oc-spinner', 'aria-hidden': 'true' }) : null, slots.default?.()],
      );
  },
});
