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
  if (error) return { describedBy: `${id}-err`, node: h('span', { id: `${id}-err`, class: 'nw-error-text' }, error) };
  if (hint) return { describedBy: `${id}-hint`, node: h('span', { id: `${id}-hint`, class: 'nw-hint' }, hint) };
  return { describedBy: undefined, node: null };
}

const fieldProps = {
  label: String,
  hint: String,
  error: String,
};

/** Text input. Use with v-model. Extra attributes (placeholder, type, …) go to the <input>. */
export const Input = defineComponent({
  name: 'NwInput',
  inheritAttrs: false,
  props: {
    ...fieldProps,
    modelValue: { type: [String, Number], default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const id = (attrs.id as string | undefined) ?? nextId('nw-input');
    return () => {
      const msg = fieldMessage(id, props.error, props.hint);
      return h('div', { class: ['nw-field', props.error && 'nw-field--error'] }, [
        props.label ? h('label', { class: 'nw-label', for: id }, props.label) : null,
        h('input', {
          ...attrs,
          id,
          class: ['nw-input', attrs.class as string],
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
  name: 'NwTextarea',
  inheritAttrs: false,
  props: {
    ...fieldProps,
    modelValue: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const id = (attrs.id as string | undefined) ?? nextId('nw-textarea');
    return () => {
      const msg = fieldMessage(id, props.error, props.hint);
      return h('div', { class: ['nw-field', props.error && 'nw-field--error'] }, [
        props.label ? h('label', { class: 'nw-label', for: id }, props.label) : null,
        h('textarea', {
          ...attrs,
          id,
          class: ['nw-textarea', attrs.class as string],
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
  name: 'NwSelect',
  inheritAttrs: false,
  props: {
    ...fieldProps,
    modelValue: { type: String, default: '' },
    options: { type: Array as PropType<SelectOption[]>, default: () => [] },
    placeholder: String,
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit, slots }) {
    const id = (attrs.id as string | undefined) ?? nextId('nw-select');
    return () => {
      const msg = fieldMessage(id, props.error, props.hint);
      return h('div', { class: ['nw-field', props.error && 'nw-field--error'] }, [
        props.label ? h('label', { class: 'nw-label', for: id }, props.label) : null,
        h(
          'select',
          {
            ...attrs,
            id,
            class: ['nw-select', attrs.class as string],
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
  name: 'NwCheckbox',
  props: {
    modelValue: Boolean,
    label: String,
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    return () =>
      h('label', { class: ['nw-check', props.disabled && 'nw-check--disabled'] }, [
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
  name: 'NwSwitch',
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
        class: 'nw-switch',
        onClick: () => emit('update:modelValue', !props.modelValue),
      });
  },
});

export const RadioGroup = defineComponent({
  name: 'NwRadioGroup',
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
        { role: 'radiogroup', 'aria-label': props.label, class: ['nw-radio-group', props.class] },
        props.options.map((o) =>
          h('label', { class: ['nw-check', o.disabled && 'nw-check--disabled'] }, [
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
  name: 'NwSlider',
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
    const id = nextId('nw-slider');
    return () =>
      h('div', { class: 'nw-field' }, [
        props.label
          ? h('label', { class: 'nw-label', for: id }, [props.label, props.showValue ? h('span', { class: 'nw-hint' }, ` ${props.modelValue}`) : null])
          : null,
        h('input', {
          id,
          type: 'range',
          class: 'nw-slider',
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
  name: 'NwSegmented',
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
        { role: 'radiogroup', 'aria-label': props.label, class: ['nw-segmented', props.class] },
        props.options.map((o, i) => {
          const checked = o.value === props.modelValue;
          return h(
            'button',
            {
              type: 'button',
              role: 'radio',
              'aria-checked': String(checked),
              tabindex: checked ? 0 : -1,
              class: 'nw-segmented__item',
              onClick: () => emit('update:modelValue', o.value),
              onKeydown: (e: KeyboardEvent) => onKeydown(e, i, e.currentTarget as HTMLElement),
            },
            o.label,
          );
        }),
      );
  },
});
