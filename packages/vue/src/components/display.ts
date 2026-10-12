import { cloneVNode, defineComponent, h, isVNode, ref, type Component, type PropType } from 'vue';
import { nextId } from '../utils';

export type Variant = 'info' | 'success' | 'warning' | 'danger';

export const Badge = defineComponent({
  name: 'OcBadge',
  props: {
    variant: { type: String as PropType<'neutral' | 'primary' | Variant>, default: 'neutral' },
  },
  setup(props, { slots }) {
    return () =>
      h('span', { class: ['oc-badge', props.variant !== 'neutral' && `oc-badge--${props.variant}`] }, slots.default?.());
  },
});

export const Tag = defineComponent({
  name: 'OcTag',
  props: {
    removable: Boolean,
  },
  emits: ['remove'],
  setup(props, { emit, slots }) {
    return () =>
      h('span', { class: 'oc-tag' }, [
        slots.default?.(),
        props.removable
          ? h('button', { type: 'button', class: 'oc-tag__remove', 'aria-label': 'Remove', onClick: () => emit('remove') }, '×')
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
  name: 'OcAvatar',
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
          class: ['oc-avatar', props.size !== 'md' && `oc-avatar--${props.size}`],
          role: 'img',
          'aria-label': props.name,
        },
        props.src ? [h('img', { src: props.src, alt: '' })] : initialsOf(props.name),
      );
  },
});

export const Card = defineComponent({
  name: 'OcCard',
  props: {
    title: String,
  },
  setup(props, { slots }) {
    return () =>
      h('article', { class: 'oc-card' }, [
        props.title || slots.title ? h('header', { class: 'oc-card__header' }, slots.title?.() ?? props.title) : null,
        slots.default ? h('div', { class: 'oc-card__body' }, slots.default()) : null,
        slots.footer ? h('footer', { class: 'oc-card__footer' }, slots.footer()) : null,
      ]);
  },
});

export const Spinner = defineComponent({
  name: 'OcSpinner',
  props: {
    size: { type: String as PropType<'md' | 'lg'>, default: 'md' },
    label: { type: String, default: 'Loading' },
  },
  setup(props) {
    return () =>
      h('span', {
        role: 'status',
        'aria-label': props.label,
        class: ['oc-spinner', props.size === 'lg' && 'oc-spinner--lg'],
      });
  },
});

export const Skeleton = defineComponent({
  name: 'OcSkeleton',
  props: {
    width: [Number, String],
    height: [Number, String],
    circle: Boolean,
  },
  setup(props) {
    return () =>
      h('span', {
        'aria-hidden': 'true',
        class: ['oc-skeleton', props.circle && 'oc-skeleton--circle'],
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
  name: 'OcSkeletonText',
  props: skeletonProps,
  setup(props) {
    return () =>
      h('div', { role: 'status', 'aria-busy': 'true', class: 'oc-skeleton-text' }, [
        h('span', { class: 'oc-sr-only' }, props.label),
        ...Array.from({ length: props.lines }, () => h(Skeleton, { height: 12 })),
      ]);
  },
});

/** Card placeholder: avatar, title lines and a body paragraph. */
export const SkeletonCard = defineComponent({
  name: 'OcSkeletonCard',
  props: skeletonProps,
  setup(props) {
    return () =>
      h('div', { role: 'status', 'aria-busy': 'true', class: 'oc-skeleton-card' }, [
        h('span', { class: 'oc-sr-only' }, props.label),
        h('div', { class: 'oc-skeleton-card__head' }, [
          h(Skeleton, { circle: true, height: 40 }),
          h('div', { class: 'oc-skeleton-text', 'aria-hidden': 'true' }, [
            h(Skeleton, { height: 12, width: '50%' }),
            h(Skeleton, { height: 10, width: '30%' }),
          ]),
        ]),
        h(
          'div',
          { class: 'oc-skeleton-text', 'aria-hidden': 'true' },
          Array.from({ length: props.lines }, () => h(Skeleton, { height: 12 })),
        ),
      ]);
  },
});

export const ProgressBar = defineComponent({
  name: 'OcProgressBar',
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
          class: ['oc-progress', indeterminate && 'oc-progress--indeterminate'],
        },
        [h('div', { class: 'oc-progress__bar', style: indeterminate ? undefined : { width: `${clamped}%` } })],
      );
    };
  },
});

export interface StepperStep {
  label: string;
  description?: string;
}

export const Stepper = defineComponent({
  name: 'OcStepper',
  props: {
    steps: { type: Array as PropType<StepperStep[]>, required: true },
    /** Zero-based index of the active step. */
    current: { type: Number, default: 0 },
  },
  setup(props) {
    return () =>
      h(
        'ol',
        { class: 'oc-stepper' },
        props.steps.map((s, i) => {
          const state = i < props.current ? 'complete' : i === props.current ? 'current' : 'upcoming';
          return h(
            'li',
            {
              class: 'oc-stepper__step',
              'data-state': state,
              'aria-current': state === 'current' ? 'step' : undefined,
            },
            [h('span', s.label), s.description ? h('span', { class: 'oc-stepper__desc' }, s.description) : null],
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
  name: 'OcTimeline',
  props: {
    items: { type: Array as PropType<TimelineItem[]>, required: true },
  },
  setup(props) {
    return () =>
      h(
        'ol',
        { class: 'oc-timeline' },
        props.items.map((item) =>
          h('li', { class: 'oc-timeline__item' }, [
            h('span', {
              class: [
                'oc-timeline__dot',
                item.variant && item.variant !== 'primary' && `oc-timeline__dot--${item.variant}`,
              ],
              'aria-hidden': 'true',
            }),
            item.time ? h('div', { class: 'oc-timeline__time' }, item.time) : null,
            h('div', { class: 'oc-timeline__title' }, item.title),
            item.description ? h('div', { class: 'oc-timeline__desc' }, item.description) : null,
          ]),
        ),
      );
  },
});

export const Alert = defineComponent({
  name: 'OcAlert',
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
          class: ['oc-alert', props.variant !== 'info' && `oc-alert--${props.variant}`],
        },
        [
          h('div', { class: 'oc-alert__body' }, [
            props.title ? h('div', { class: 'oc-alert__title' }, props.title) : null,
            slots.default?.(),
          ]),
          props.closable
            ? h('button', { type: 'button', class: 'oc-close', 'aria-label': 'Dismiss', onClick: () => emit('close') }, '×')
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
 * (e.g. `NoResultsIllustration` from `@orca-ui/illustrations/vue`) or a scene name
 * (renders `<oc-illustration>`; register it with `import '@orca-ui/illustrations/element'`).
 * Slots: illustration, icon (legacy), description, primary, secondary, actions, default (actions).
 */
export const EmptyState = defineComponent({
  name: 'OcEmptyState',
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
          ? h('oc-illustration', { name: ill, compact: props.size === 'compact' ? '' : undefined })
          : ill
            ? h(ill as Component)
            : null;
      const actions = [slots.primary?.(), slots.secondary?.(), slots.actions?.(), slots.default?.()].filter(Boolean);
      const desc = slots.description ? slots.description() : props.description;
      return h(
        'div',
        {
          class: [
            'oc-empty',
            props.size !== 'default' && `oc-empty--${props.size}`,
            props.align === 'start' && 'oc-empty--start',
            props.layout === 'split' && 'oc-empty--split',
            props.tone && `oc-empty--tone-${props.tone}`,
          ],
        },
        [
          h('div', { class: 'oc-empty__inner' }, [
            media ? h('div', { class: 'oc-empty__media' }, media) : null,
            slots.icon ? h('div', { class: 'oc-empty__icon', 'aria-hidden': 'true' }, slots.icon()) : null,
            h('div', { class: 'oc-empty__body' }, [
              h(props.headingLevel ? `h${props.headingLevel}` : 'p', { class: 'oc-empty__title' }, props.title),
              desc ? h('p', { class: 'oc-empty__desc' }, desc) : null,
              actions.length ? h('div', { class: 'oc-empty__actions oc-empty__action' }, actions) : null,
            ]),
          ]),
        ],
      );
    };
  },
});

export const Tooltip = defineComponent({
  name: 'OcTooltip',
  props: {
    text: { type: String, required: true },
    placement: { type: String as PropType<'top' | 'bottom'>, default: 'top' },
  },
  /**
   * The first element in the default slot is the trigger: it gets aria-describedby.
   * Escape hides the bubble until the pointer leaves or focus moves (WCAG 1.4.13).
   */
  setup(props, { slots }) {
    const id = nextId('oc-tip');
    const dismissed = ref(false);
    return () => {
      const [first, ...rest] = slots.default?.() ?? [];
      const trigger = first && isVNode(first) && typeof first.type !== 'symbol' ? cloneVNode(first, { 'aria-describedby': id }) : first;
      return h(
        'span',
        {
          class: ['oc-tooltip', props.placement === 'bottom' && 'oc-tooltip--bottom'],
          'data-dismissed': dismissed.value ? '' : undefined,
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') dismissed.value = true;
          },
          onMouseleave: () => (dismissed.value = false),
          onFocusout: () => (dismissed.value = false),
        },
        [trigger, ...rest, h('span', { role: 'tooltip', id, class: 'oc-tooltip__bubble' }, props.text)],
      );
    };
  },
});

export const Divider = defineComponent({
  name: 'OcDivider',
  setup() {
    return () => h('hr', { class: 'oc-divider' });
  },
});
