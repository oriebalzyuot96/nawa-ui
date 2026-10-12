import { cloneVNode, defineComponent, h, isVNode, ref, type PropType } from 'vue';
import { nextId } from '../utils';

export type Variant = 'info' | 'success' | 'warning' | 'danger';

export const Badge = defineComponent({
  name: 'NwBadge',
  props: {
    variant: { type: String as PropType<'neutral' | 'primary' | Variant>, default: 'neutral' },
  },
  setup(props, { slots }) {
    return () =>
      h('span', { class: ['nw-badge', props.variant !== 'neutral' && `nw-badge--${props.variant}`] }, slots.default?.());
  },
});

export const Tag = defineComponent({
  name: 'NwTag',
  props: {
    removable: Boolean,
  },
  emits: ['remove'],
  setup(props, { emit, slots }) {
    return () =>
      h('span', { class: 'nw-tag' }, [
        slots.default?.(),
        props.removable
          ? h('button', { type: 'button', class: 'nw-tag__remove', 'aria-label': 'Remove', onClick: () => emit('remove') }, '×')
          : null,
      ]);
  },
});

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const Avatar = defineComponent({
  name: 'NwAvatar',
  props: {
    src: String,
    /** Used for alt text and initials when no image is given. */
    name: { type: String, required: true },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
  },
  setup(props) {
    return () =>
      h(
        'span',
        {
          class: ['nw-avatar', props.size !== 'md' && `nw-avatar--${props.size}`],
          role: 'img',
          'aria-label': props.name,
        },
        props.src ? [h('img', { src: props.src, alt: '' })] : initialsOf(props.name),
      );
  },
});

export const Card = defineComponent({
  name: 'NwCard',
  props: {
    title: String,
  },
  setup(props, { slots }) {
    return () =>
      h('article', { class: 'nw-card' }, [
        props.title || slots.title ? h('header', { class: 'nw-card__header' }, slots.title?.() ?? props.title) : null,
        slots.default ? h('div', { class: 'nw-card__body' }, slots.default()) : null,
        slots.footer ? h('footer', { class: 'nw-card__footer' }, slots.footer()) : null,
      ]);
  },
});

export const Spinner = defineComponent({
  name: 'NwSpinner',
  props: {
    size: { type: String as PropType<'md' | 'lg'>, default: 'md' },
    label: { type: String, default: 'Loading' },
  },
  setup(props) {
    return () =>
      h('span', {
        role: 'status',
        'aria-label': props.label,
        class: ['nw-spinner', props.size === 'lg' && 'nw-spinner--lg'],
      });
  },
});

export const Skeleton = defineComponent({
  name: 'NwSkeleton',
  props: {
    width: [Number, String],
    height: [Number, String],
    circle: Boolean,
  },
  setup(props) {
    return () =>
      h('span', {
        'aria-hidden': 'true',
        class: ['nw-skeleton', props.circle && 'nw-skeleton--circle'],
        style: {
          width: props.circle ? toCss(props.height ?? props.width) : toCss(props.width),
          height: toCss(props.height),
        },
      });
  },
});

function toCss(v: number | string | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

const skeletonProps = {
  lines: { type: Number, default: 3 },
  /** Announced to screen readers while loading. */
  label: { type: String, default: 'Loading…' },
};

/** Paragraph placeholder. The last line is shorter. Announced once as a loading status. */
export const SkeletonText = defineComponent({
  name: 'NwSkeletonText',
  props: skeletonProps,
  setup(props) {
    return () =>
      h('div', { role: 'status', 'aria-busy': 'true', class: 'nw-skeleton-text' }, [
        h('span', { class: 'nw-sr-only' }, props.label),
        ...Array.from({ length: props.lines }, () => h(Skeleton, { height: 12 })),
      ]);
  },
});

/** Card placeholder: avatar, title lines and a body paragraph. */
export const SkeletonCard = defineComponent({
  name: 'NwSkeletonCard',
  props: skeletonProps,
  setup(props) {
    return () =>
      h('div', { role: 'status', 'aria-busy': 'true', class: 'nw-skeleton-card' }, [
        h('span', { class: 'nw-sr-only' }, props.label),
        h('div', { class: 'nw-skeleton-card__head' }, [
          h(Skeleton, { circle: true, height: 40 }),
          h('div', { class: 'nw-skeleton-text', 'aria-hidden': 'true' }, [
            h(Skeleton, { height: 12, width: '50%' }),
            h(Skeleton, { height: 10, width: '30%' }),
          ]),
        ]),
        h(
          'div',
          { class: 'nw-skeleton-text', 'aria-hidden': 'true' },
          Array.from({ length: props.lines }, () => h(Skeleton, { height: 12 })),
        ),
      ]);
  },
});

export const ProgressBar = defineComponent({
  name: 'NwProgressBar',
  props: {
    /** 0–100. Leave undefined for an indeterminate bar. */
    value: Number,
    label: { type: String, default: 'Progress' },
  },
  setup(props) {
    return () => {
      const indeterminate = props.value === undefined;
      const clamped = indeterminate ? undefined : Math.min(100, Math.max(0, props.value as number));
      return h(
        'div',
        {
          role: 'progressbar',
          'aria-label': props.label,
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': clamped,
          class: ['nw-progress', indeterminate && 'nw-progress--indeterminate'],
        },
        [h('div', { class: 'nw-progress__bar', style: indeterminate ? undefined : { width: `${clamped}%` } })],
      );
    };
  },
});

export interface StepperStep {
  label: string;
  description?: string;
}

export const Stepper = defineComponent({
  name: 'NwStepper',
  props: {
    steps: { type: Array as PropType<StepperStep[]>, required: true },
    /** Zero-based index of the active step. */
    current: { type: Number, default: 0 },
  },
  setup(props) {
    return () =>
      h(
        'ol',
        { class: 'nw-stepper' },
        props.steps.map((s, i) => {
          const state = i < props.current ? 'complete' : i === props.current ? 'current' : 'upcoming';
          return h(
            'li',
            {
              class: 'nw-stepper__step',
              'data-state': state,
              'aria-current': state === 'current' ? 'step' : undefined,
            },
            [h('span', s.label), s.description ? h('span', { class: 'nw-stepper__desc' }, s.description) : null],
          );
        }),
      );
  },
});

export interface TimelineItem {
  title: string;
  description?: string;
  time?: string;
  variant?: 'primary' | Variant;
}

export const Timeline = defineComponent({
  name: 'NwTimeline',
  props: {
    items: { type: Array as PropType<TimelineItem[]>, required: true },
  },
  setup(props) {
    return () =>
      h(
        'ol',
        { class: 'nw-timeline' },
        props.items.map((item) =>
          h('li', { class: 'nw-timeline__item' }, [
            h('span', {
              class: [
                'nw-timeline__dot',
                item.variant && item.variant !== 'primary' && `nw-timeline__dot--${item.variant}`,
              ],
              'aria-hidden': 'true',
            }),
            item.time ? h('div', { class: 'nw-timeline__time' }, item.time) : null,
            h('div', { class: 'nw-timeline__title' }, item.title),
            item.description ? h('div', { class: 'nw-timeline__desc' }, item.description) : null,
          ]),
        ),
      );
  },
});

export const Alert = defineComponent({
  name: 'NwAlert',
  props: {
    variant: { type: String as PropType<Variant>, default: 'info' },
    title: String,
    closable: Boolean,
  },
  emits: ['close'],
  setup(props, { emit, slots }) {
    return () => {
      const urgent = props.variant === 'danger' || props.variant === 'warning';
      return h(
        'div',
        {
          role: urgent ? 'alert' : 'status',
          class: ['nw-alert', props.variant !== 'info' && `nw-alert--${props.variant}`],
        },
        [
          h('div', { class: 'nw-alert__body' }, [
            props.title ? h('div', { class: 'nw-alert__title' }, props.title) : null,
            slots.default?.(),
          ]),
          props.closable
            ? h('button', { type: 'button', class: 'nw-close', 'aria-label': 'Dismiss', onClick: () => emit('close') }, '×')
            : null,
        ],
      );
    };
  },
});

export const EmptyState = defineComponent({
  name: 'NwEmptyState',
  props: {
    title: { type: String, required: true },
    description: String,
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'nw-empty' }, [
        slots.icon ? h('div', { class: 'nw-empty__icon', 'aria-hidden': 'true' }, slots.icon()) : null,
        h('div', { class: 'nw-empty__title' }, props.title),
        props.description ? h('p', { class: 'nw-empty__desc' }, props.description) : null,
        slots.default ? h('div', { class: 'nw-empty__action' }, slots.default()) : null,
      ]);
  },
});

export const Tooltip = defineComponent({
  name: 'NwTooltip',
  props: {
    text: { type: String, required: true },
    placement: { type: String as PropType<'top' | 'bottom'>, default: 'top' },
  },
  /**
   * The first element in the default slot is the trigger: it gets aria-describedby.
   * Escape hides the bubble until the pointer leaves or focus moves (WCAG 1.4.13).
   */
  setup(props, { slots }) {
    const id = nextId('nw-tip');
    const dismissed = ref(false);
    return () => {
      const [first, ...rest] = slots.default?.() ?? [];
      const trigger = first && isVNode(first) && typeof first.type !== 'symbol' ? cloneVNode(first, { 'aria-describedby': id }) : first;
      return h(
        'span',
        {
          class: ['nw-tooltip', props.placement === 'bottom' && 'nw-tooltip--bottom'],
          'data-dismissed': dismissed.value ? '' : undefined,
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') dismissed.value = true;
          },
          onMouseleave: () => (dismissed.value = false),
          onFocusout: () => (dismissed.value = false),
        },
        [trigger, ...rest, h('span', { role: 'tooltip', id, class: 'nw-tooltip__bubble' }, props.text)],
      );
    };
  },
});

export const Divider = defineComponent({
  name: 'NwDivider',
  setup() {
    return () => h('hr', { class: 'nw-divider' });
  },
});
