import { defineComponent, h, ref, type PropType } from 'vue';
import { getPageItems, nextId } from '../utils';

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

/**
 * Tabs with arrow-key navigation. Panel content goes in the slot named `panel-<key>`,
 * e.g. <template #panel-overview>…</template>.
 */
export const Tabs = defineComponent({
  name: 'PlTabs',
  props: {
    tabs: { type: Array as PropType<TabItem[]>, required: true },
    modelValue: String,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, slots }) {
    const inner = ref(props.tabs[0]?.key);
    const baseId = nextId('pl-tabs');
    const buttons: Array<HTMLButtonElement | null> = [];

    const active = () => props.modelValue ?? inner.value;
    const select = (key: string) => {
      if (props.modelValue === undefined) inner.value = key;
      emit('update:modelValue', key);
      emit('change', key);
    };

    const onKeydown = (e: KeyboardEvent, index: number) => {
      const enabled = props.tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
      if (!enabled.length) return;
      const pos = enabled.indexOf(index);
      let next: number | undefined;
      if (e.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length];
      else if (e.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length];
      else if (e.key === 'Home') next = enabled[0];
      else if (e.key === 'End') next = enabled[enabled.length - 1];
      if (next === undefined) return;
      e.preventDefault();
      buttons[next]?.focus();
      select(props.tabs[next].key);
    };

    return () => {
      const current = active();
      const panel = slots[`panel-${current}`];
      return h('div', { class: 'pl-tabs' }, [
        h(
          'div',
          { role: 'tablist', class: 'pl-tabs__list' },
          props.tabs.map((t, i) => {
            const selected = t.key === current;
            return h(
              'button',
              {
                ref: (el: unknown) => {
                  buttons[i] = el as HTMLButtonElement | null;
                },
                id: `${baseId}-tab-${t.key}`,
                type: 'button',
                role: 'tab',
                'aria-selected': String(selected),
                'aria-controls': `${baseId}-panel-${t.key}`,
                tabindex: selected ? 0 : -1,
                disabled: t.disabled,
                class: 'pl-tabs__tab',
                onClick: () => select(t.key),
                onKeydown: (e: KeyboardEvent) => onKeydown(e, i),
              },
              t.label,
            );
          }),
        ),
        panel
          ? h(
              'div',
              {
                role: 'tabpanel',
                id: `${baseId}-panel-${current}`,
                'aria-labelledby': `${baseId}-tab-${current}`,
                class: 'pl-tabs__panel',
              },
              panel(),
            )
          : null,
      ]);
    };
  },
});

export const Breadcrumb = defineComponent({
  name: 'PlBreadcrumb',
  props: {
    items: { type: Array as PropType<Array<{ label: string; href?: string }>>, required: true },
  },
  setup(props) {
    return () =>
      h('nav', { 'aria-label': 'Breadcrumb' }, [
        h(
          'ol',
          { class: 'pl-breadcrumb' },
          props.items.map((item, i) => {
            const last = i === props.items.length - 1;
            return h(
              'li',
              { class: 'pl-breadcrumb__item', 'aria-current': last ? 'page' : undefined },
              item.href && !last ? [h('a', { href: item.href }, item.label)] : item.label,
            );
          }),
        ),
      ]);
  },
});

export const Pagination = defineComponent({
  name: 'PlPagination',
  props: {
    /** 1-based current page. */
    modelValue: { type: Number, required: true },
    pageCount: { type: Number, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('nav', { 'aria-label': 'Pagination', class: 'pl-pagination' }, [
        h('button', {
          type: 'button',
          class: 'pl-pagination__btn',
          'aria-label': 'Previous page',
          disabled: props.modelValue <= 1,
          onClick: () => emit('update:modelValue', props.modelValue - 1),
        }, '‹'),
        ...getPageItems(props.modelValue, props.pageCount).map((item, i) =>
          item === 'ellipsis'
            ? h('span', { class: 'pl-pagination__ellipsis', 'aria-hidden': 'true', key: `e${i}` }, '…')
            : h(
                'button',
                {
                  key: item,
                  type: 'button',
                  class: 'pl-pagination__btn',
                  'aria-current': item === props.modelValue ? 'page' : undefined,
                  'aria-label': `Page ${item}`,
                  onClick: () => emit('update:modelValue', item),
                },
                String(item),
              ),
        ),
        h('button', {
          type: 'button',
          class: 'pl-pagination__btn',
          'aria-label': 'Next page',
          disabled: props.modelValue >= props.pageCount,
          onClick: () => emit('update:modelValue', props.modelValue + 1),
        }, '›'),
      ]);
  },
});

/** Accordion. Panel content goes in the slot named `panel-<key>`. */
export const Accordion = defineComponent({
  name: 'PlAccordion',
  props: {
    items: { type: Array as PropType<Array<{ key: string; title: string }>>, required: true },
    multiple: Boolean,
    defaultOpen: { type: Array as PropType<string[]>, default: () => [] },
  },
  setup(props, { slots }) {
    const open = ref<string[]>([...props.defaultOpen]);
    const baseId = nextId('pl-acc');
    const toggle = (key: string) => {
      if (open.value.includes(key)) {
        open.value = open.value.filter((k) => k !== key);
      } else {
        open.value = props.multiple ? [...open.value, key] : [key];
      }
    };
    return () =>
      h(
        'div',
        { class: 'pl-accordion' },
        props.items.map((item) => {
          const expanded = open.value.includes(item.key);
          const panelId = `${baseId}-${item.key}-panel`;
          const panel = slots[`panel-${item.key}`];
          return h('div', { class: 'pl-accordion__item', key: item.key }, [
            h('h3', { style: { margin: '0' } }, [
              h(
                'button',
                {
                  type: 'button',
                  class: 'pl-accordion__trigger',
                  'aria-expanded': String(expanded),
                  'aria-controls': panelId,
                  onClick: () => toggle(item.key),
                },
                [
                  item.title,
                  h('span', { class: 'pl-accordion__icon', 'aria-hidden': 'true' }, '▾'),
                ],
              ),
            ]),
            expanded && panel
              ? h('div', { id: panelId, role: 'region', class: 'pl-accordion__panel' }, panel())
              : null,
          ]);
        }),
      );
  },
});
