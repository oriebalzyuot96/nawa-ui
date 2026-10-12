import { defineComponent, h, type PropType, type VNode } from 'vue';
import { nextId } from '../utils';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SegmentedOption {
  label: string;
  value: string;
}

function fieldMessage(id: string, error?: string, hint?: string): { describedBy?: string; node: VNode | null } {
  if (error) return { describedBy: `${id}-err`, node: h('span', { id: `${id}-err`, class: 'oc-error-text' }, error) };
  if (hint) return { describedBy: `${id}-hint`, node: h('span', { id: `${id}-hint`, class: 'oc-hint' }, hint) };
  return { describedBy: undefined, node: null };
}

const fieldProps = {
  label: String,
  hint: String,
  error: String,
};

/** Text input. Use with v-model. Extra attributes (placeholder, type, …) go to the <input>. */
export const Input = defineComponent({
  name: 'OcInput',
  inheritAttrs: false,
  props: {
    ...fieldProps,
    modelValue: { type: [String, Number], default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const id = (attrs.id as string | undefined) ?? nextId('oc-input');
    return () => {
      const msg = fieldMessage(id, props.error, props.hint);
      return h('div', { class: ['oc-field', props.error && 'oc-field--error'] }, [
        props.label ? h('label', { class: 'oc-label', for: id }, props.label) : null,
        h('input', {
          ...attrs,
          id,
          class: ['oc-input', attrs.class as string],
          value: props.modelValue,
          'aria-invalid': props.error ? 'true' : undefined,
          'aria-describedby': msg.describedBy,
          onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
        }),
        msg.node,
      ]);
    };
  },
});

export const Textarea = defineComponent({
  name: 'OcTextarea',
  inheritAttrs: false,
  props: {
    ...fieldProps,
    modelValue: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const id = (attrs.id as string | undefined) ?? nextId('oc-textarea');
    return () => {
      const msg = fieldMessage(id, props.error, props.hint);
      return h('div', { class: ['oc-field', props.error && 'oc-field--error'] }, [
        props.label ? h('label', { class: 'oc-label', for: id }, props.label) : null,
        h('textarea', {
          ...attrs,
          id,
          class: ['oc-textarea', attrs.class as string],
          value: props.modelValue,
          'aria-invalid': props.error ? 'true' : undefined,
          'aria-describedby': msg.describedBy,
          onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value),
        }),
        msg.node,
      ]);
    };
  },
});

/** Native select. Pass `options`, or put <option>-like content in the default slot. */
export const Select = defineComponent({
  name: 'OcSelect',
  inheritAttrs: false,
  props: {
    ...fieldProps,
    modelValue: { type: String, default: '' },
    options: { type: Array as PropType<SelectOption[]>, default: () => [] },
    placeholder: String,
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit, slots }) {
    const id = (attrs.id as string | undefined) ?? nextId('oc-select');
    return () => {
      const msg = fieldMessage(id, props.error, props.hint);
      return h('div', { class: ['oc-field', props.error && 'oc-field--error'] }, [
        props.label ? h('label', { class: 'oc-label', for: id }, props.label) : null,
        h(
          'select',
          {
            ...attrs,
            id,
            class: ['oc-select', attrs.class as string],
            value: props.modelValue,
            'aria-invalid': props.error ? 'true' : undefined,
            'aria-describedby': msg.describedBy,
            onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value),
          },
          [
            props.placeholder ? h('option', { value: '' }, props.placeholder) : null,
            ...props.options.map((o) => h('option', { value: o.value, disabled: o.disabled }, o.label)),
            slots.default?.(),
          ],
        ),
        msg.node,
      ]);
    };
  },
});

export const Checkbox = defineComponent({
  name: 'OcCheckbox',
  props: {
    modelValue: Boolean,
    label: String,
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    return () =>
      h('label', { class: ['oc-check', props.disabled && 'oc-check--disabled'] }, [
        h('input', {
          type: 'checkbox',
          checked: props.modelValue,
          disabled: props.disabled,
          onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).checked),
        }),
        props.label ?? slots.default?.(),
      ]);
  },
});

export const Switch = defineComponent({
  name: 'OcSwitch',
  props: {
    modelValue: Boolean,
    /** Accessible name. */
    label: { type: String, required: true },
    disabled: Boolean,
    id: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        id: props.id,
        type: 'button',
        role: 'switch',
        'aria-checked': String(props.modelValue),
        'aria-label': props.label,
        disabled: props.disabled,
        class: 'oc-switch',
        onClick: () => emit('update:modelValue', !props.modelValue),
      });
  },
});

export const RadioGroup = defineComponent({
  name: 'OcRadioGroup',
  props: {
    name: { type: String, required: true },
    options: { type: Array as PropType<RadioOption[]>, required: true },
    modelValue: String,
    label: String,
    class: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        { role: 'radiogroup', 'aria-label': props.label, class: ['oc-radio-group', props.class] },
        props.options.map((o) =>
          h('label', { class: ['oc-check', o.disabled && 'oc-check--disabled'] }, [
            h('input', {
              type: 'radio',
              name: props.name,
              value: o.value,
              checked: props.modelValue === o.value,
              disabled: o.disabled,
              onChange: () => emit('update:modelValue', o.value),
            }),
            o.label,
          ]),
        ),
      );
  },
});

export const Slider = defineComponent({
  name: 'OcSlider',
  props: {
    modelValue: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    label: String,
    showValue: Boolean,
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const id = nextId('oc-slider');
    return () =>
      h('div', { class: 'oc-field' }, [
        props.label
          ? h('label', { class: 'oc-label', for: id }, [props.label, props.showValue ? h('span', { class: 'oc-hint' }, ` ${props.modelValue}`) : null])
          : null,
        h('input', {
          id,
          type: 'range',
          class: 'oc-slider',
          min: props.min,
          max: props.max,
          step: props.step,
          value: props.modelValue,
          disabled: props.disabled,
          onInput: (e: Event) => emit('update:modelValue', Number((e.target as HTMLInputElement).value)),
        }),
      ]);
  },
});

export const Segmented = defineComponent({
  name: 'OcSegmented',
  props: {
    options: { type: Array as PropType<SegmentedOption[]>, required: true },
    modelValue: { type: String, required: true },
    label: { type: String, required: true },
    class: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const onKeydown = (e: KeyboardEvent, index: number, el: HTMLElement | null) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const nextIndex = (index + dir + props.options.length) % props.options.length;
      emit('update:modelValue', props.options[nextIndex].value);
      (el?.parentElement?.children[nextIndex] as HTMLElement | undefined)?.focus();
    };
    return () =>
      h(
        'div',
        { role: 'radiogroup', 'aria-label': props.label, class: ['oc-segmented', props.class] },
        props.options.map((o, i) => {
          const checked = o.value === props.modelValue;
          return h(
            'button',
            {
              type: 'button',
              role: 'radio',
              'aria-checked': String(checked),
              tabindex: checked ? 0 : -1,
              class: 'oc-segmented__item',
              onClick: () => emit('update:modelValue', o.value),
              onKeydown: (e: KeyboardEvent) => onKeydown(e, i, e.currentTarget as HTMLElement),
            },
            o.label,
          );
        }),
      );
  },
});
