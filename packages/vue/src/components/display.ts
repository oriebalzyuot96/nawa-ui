import { cloneVNode, defineComponent, h, isVNode, ref, type Component, type PropType } from 'vue';
import { nextId } from '../utils';

export type Variant = 'info' | 'success' | 'warning' | 'danger';

export const Badge = defineComponent({
  name: 'PlBadge',
  props: {
    variant: { type: String as PropType<'neutral' | 'primary' | Variant>, default: 'neutral' },
  },
  setup(props, { slots }) {
    return () =>
      h('span', { class: ['pl-badge', props.variant !== 'neutral' && `pl-badge--${props.variant}`] }, slots.default?.());
  },
});

export const Tag = defineComponent({
  name: 'PlTag',
  props: {
    removable: Boolean,
  },
  emits: ['remove'],
  setup(props, { emit, slots }) {
    return () =>
      h('span', { class: 'pl-tag' }, [
        slots.default?.(),
        props.removable
          ? h('button', { type: 'button', class: 'pl-tag__remove', 'aria-label': 'Remove', onClick: () => emit('remove') }, '×')
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
  name: 'PlAvatar',
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
          class: ['pl-avatar', props.size !== 'md' && `pl-avatar--${props.size}`],
          role: 'img',
          'aria-label': props.name,
        },
        props.src ? [h('img', { src: props.src, alt: '' })] : initialsOf(props.name),
      );
  },
});

export const Card = defineComponent({
  name: 'PlCard',
  props: {
    title: String,
  },
  setup(props, { slots }) {
    return () =>
      h('article', { class: 'pl-card' }, [
        props.title || slots.title ? h('header', { class: 'pl-card__header' }, slots.title?.() ?? props.title) : null,
        slots.default ? h('div', { class: 'pl-card__body' }, slots.default()) : null,
        slots.footer ? h('footer', { class: 'pl-card__footer' }, slots.footer()) : null,
      ]);
  },
});

export const Spinner = defineComponent({
  name: 'PlSpinner',
  props: {
    size: { type: String as PropType<'md' | 'lg'>, default: 'md' },
    label: { type: String, default: 'Loading' },
  },
  setup(props) {
    return () =>
      h('span', {
        role: 'status',
        'aria-label': props.label,
        class: ['pl-spinner', props.size === 'lg' && 'pl-spinner--lg'],
      });
  },
});

export const Skeleton = defineComponent({
  name: 'PlSkeleton',
  props: {
    width: [Number, String],
    height: [Number, String],
    circle: Boolean,
  },
  setup(props) {
    return () =>
      h('span', {
        'aria-hidden': 'true',
        class: ['pl-skeleton', props.circle && 'pl-skeleton--circle'],
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
  name: 'PlSkeletonText',
  props: skeletonProps,
  setup(props) {
    return () =>
      h('div', { role: 'status', 'aria-busy': 'true', class: 'pl-skeleton-text' }, [
        h('span', { class: 'pl-sr-only' }, props.label),
        ...Array.from({ length: props.lines }, () => h(Skeleton, { height: 12 })),
      ]);
  },
});

/** Card placeholder: avatar, title lines and a body paragraph. */
export const SkeletonCard = defineComponent({
  name: 'PlSkeletonCard',
  props: skeletonProps,
  setup(props) {
    return () =>
      h('div', { role: 'status', 'aria-busy': 'true', class: 'pl-skeleton-card' }, [
        h('span', { class: 'pl-sr-only' }, props.label),
        h('div', { class: 'pl-skeleton-card__head' }, [
          h(Skeleton, { circle: true, height: 40 }),
          h('div', { class: 'pl-skeleton-text', 'aria-hidden': 'true' }, [
            h(Skeleton, { height: 12, width: '50%' }),
            h(Skeleton, { height: 10, width: '30%' }),
          ]),
        ]),
        h(
          'div',
          { class: 'pl-skeleton-text', 'aria-hidden': 'true' },
          Array.from({ length: props.lines }, () => h(Skeleton, { height: 12 })),
        ),
      ]);
  },
});

export const ProgressBar = defineComponent({
  name: 'PlProgressBar',
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
          class: ['pl-progress', indeterminate && 'pl-progress--indeterminate'],
        },
        [h('div', { class: 'pl-progress__bar', style: indeterminate ? undefined : { width: `${clamped}%` } })],
      );
    };
  },
});

export interface StepperStep {
  label: string;
  description?: string;
}

export const Stepper = defineComponent({
  name: 'PlStepper',
  props: {
    steps: { type: Array as PropType<StepperStep[]>, required: true },
    /** Zero-based index of the active step. */
    current: { type: Number, default: 0 },
  },
  setup(props) {
    return () =>
      h(
        'ol',
        { class: 'pl-stepper' },
        props.steps.map((s, i) => {
          const state = i < props.current ? 'complete' : i === props.current ? 'current' : 'upcoming';
          return h(
            'li',
            {
              class: 'pl-stepper__step',
              'data-state': state,
              'aria-current': state === 'current' ? 'step' : undefined,
            },
            [h('span', s.label), s.description ? h('span', { class: 'pl-stepper__desc' }, s.description) : null],
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
  name: 'PlTimeline',
  props: {
    items: { type: Array as PropType<TimelineItem[]>, required: true },
  },
  setup(props) {
    return () =>
      h(
        'ol',
        { class: 'pl-timeline' },
        props.items.map((item) =>
          h('li', { class: 'pl-timeline__item' }, [
            h('span', {
              class: [
                'pl-timeline__dot',
                item.variant && item.variant !== 'primary' && `pl-timeline__dot--${item.variant}`,
              ],
              'aria-hidden': 'true',
            }),
            item.time ? h('div', { class: 'pl-timeline__time' }, item.time) : null,
            h('div', { class: 'pl-timeline__title' }, item.title),
            item.description ? h('div', { class: 'pl-timeline__desc' }, item.description) : null,
          ]),
        ),
      );
  },
});

export const Alert = defineComponent({
  name: 'PlAlert',
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
          class: ['pl-alert', props.variant !== 'info' && `pl-alert--${props.variant}`],
        },
        [
          h('div', { class: 'pl-alert__body' }, [
            props.title ? h('div', { class: 'pl-alert__title' }, props.title) : null,
            slots.default?.(),
          ]),
          props.closable
            ? h('button', { type: 'button', class: 'pl-close', 'aria-label': 'Dismiss', onClick: () => emit('close') }, '×')
            : null,
        ],
      );
    };
  },
});

export type EmptyStateSize = 'compact' | 'default' | 'page';
export type EmptyStateTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Illustrated empty state. Illustration: the `illustration` slot, a component
 * (e.g. `NoResultsIllustration` from `@pelagic-ui/illustrations/vue`) or a scene name
 * (renders `<pl-illustration>`; register it with `import '@pelagic-ui/illustrations/element'`).
 * Slots: illustration, icon (legacy), description, primary, secondary, actions, default (actions).
 */
export const EmptyState = defineComponent({
  name: 'PlEmptyState',
  props: {
    title: { type: String, required: true },
    description: String,
    illustration: { type: [String, Object, Function, Boolean] as PropType<string | Component | false>, default: undefined },
    size: { type: String as PropType<EmptyStateSize>, default: 'default' },
    align: { type: String as PropType<'center' | 'start'>, default: 'center' },
    layout: { type: String as PropType<'stack' | 'split'>, default: 'stack' },
    tone: String as PropType<EmptyStateTone>,
    /** Heading level for the title (default 3); `false` renders a paragraph. */
    headingLevel: { type: [Number, Boolean] as PropType<1 | 2 | 3 | 4 | 5 | 6 | false>, default: 3 },
  },
  setup(props, { slots }) {
    return () => {
      const ill = props.illustration;
      const media = slots.illustration
        ? slots.illustration()
        : typeof ill === 'string' && ill
          ? h('pl-illustration', { name: ill, compact: props.size === 'compact' ? '' : undefined })
          : ill
            ? h(ill as Component)
            : null;
      const actions = [slots.primary?.(), slots.secondary?.(), slots.actions?.(), slots.default?.()].filter(Boolean);
      const desc = slots.description ? slots.description() : props.description;
      return h(
        'div',
        {
          class: [
            'pl-empty',
            props.size !== 'default' && `pl-empty--${props.size}`,
            props.align === 'start' && 'pl-empty--start',
            props.layout === 'split' && 'pl-empty--split',
            props.tone && `pl-empty--tone-${props.tone}`,
          ],
        },
        [
          h('div', { class: 'pl-empty__inner' }, [
            media ? h('div', { class: 'pl-empty__media' }, media) : null,
            slots.icon ? h('div', { class: 'pl-empty__icon', 'aria-hidden': 'true' }, slots.icon()) : null,
            h('div', { class: 'pl-empty__body' }, [
              h(props.headingLevel ? `h${props.headingLevel}` : 'p', { class: 'pl-empty__title' }, props.title),
              desc ? h('p', { class: 'pl-empty__desc' }, desc) : null,
              actions.length ? h('div', { class: 'pl-empty__actions pl-empty__action' }, actions) : null,
            ]),
          ]),
        ],
      );
    };
  },
});

export const Tooltip = defineComponent({
  name: 'PlTooltip',
  props: {
    text: { type: String, required: true },
    placement: { type: String as PropType<'top' | 'bottom'>, default: 'top' },
  },
  /**
   * The first element in the default slot is the trigger: it gets aria-describedby.
   * Escape hides the bubble until the pointer leaves or focus moves (WCAG 1.4.13).
   */
  setup(props, { slots }) {
    const id = nextId('pl-tip');
    const dismissed = ref(false);
    return () => {
      const [first, ...rest] = slots.default?.() ?? [];
      const trigger = first && isVNode(first) && typeof first.type !== 'symbol' ? cloneVNode(first, { 'aria-describedby': id }) : first;
      return h(
        'span',
        {
          class: ['pl-tooltip', props.placement === 'bottom' && 'pl-tooltip--bottom'],
          'data-dismissed': dismissed.value ? '' : undefined,
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') dismissed.value = true;
          },
          onMouseleave: () => (dismissed.value = false),
          onFocusout: () => (dismissed.value = false),
        },
        [trigger, ...rest, h('span', { role: 'tooltip', id, class: 'pl-tooltip__bubble' }, props.text)],
      );
    };
  },
});

export const Divider = defineComponent({
  name: 'PlDivider',
  setup() {
    return () => h('hr', { class: 'pl-divider' });
  },
});
