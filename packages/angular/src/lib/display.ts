import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  contentChild,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { cx, initialsOf, toCssSize, type Variant } from './utils';

export type BadgeVariant = 'neutral' | 'primary' | Variant;

@Component({
  selector: 'oc-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class OcBadge {
  readonly variant = input<BadgeVariant>('neutral');
  protected readonly classes = computed(() => cx('oc-badge', this.variant() !== 'neutral' && `oc-badge--${this.variant()}`));
}

@Component({
  selector: 'oc-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'oc-tag' },
  template: `<ng-content />
    @if (removable()) {
      <button type="button" class="oc-tag__remove" [attr.aria-label]="removeLabel()" (click)="removed.emit()">×</button>
    }`,
})
export class OcTag {
  readonly removable = input(false, { transform: booleanAttribute });
  readonly removeLabel = input('Remove');
  readonly removed = output<void>();
}

@Component({
  selector: 'oc-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'name()', '[class]': 'classes()' },
  template: `@if (src()) {<img [src]="src()" alt="" />} @else {{{ initials() }}}`,
})
export class OcAvatar {
  /** Used for the accessible name and initials when no image is given. */
  readonly name = input.required<string>();
  readonly src = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly classes = computed(() => cx('oc-avatar', this.size() !== 'md' && `oc-avatar--${this.size()}`));
}

/** Optional custom header content: `<span ocCardHeader>…</span>`. */
@Directive({ selector: '[ocCardHeader]' })
export class OcCardHeader {}

/** Optional footer content: `<div ocCardFooter>…</div>`. */
@Directive({ selector: '[ocCardFooter]' })
export class OcCardFooter {}

@Component({
  selector: 'oc-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '[attr.title]': 'null' },
  template: `
    <article class="oc-card">
      @if (title() || header()) {
        <header class="oc-card__header">{{ title() }}<ng-content select="[ocCardHeader]" /></header>
      }
      <div class="oc-card__body"><ng-content /></div>
      @if (footer()) {
        <footer class="oc-card__footer"><ng-content select="[ocCardFooter]" /></footer>
      }
    </article>
  `,
})
export class OcCard {
  readonly title = input<string>();
  protected readonly header = contentChild(OcCardHeader);
  protected readonly footer = contentChild(OcCardFooter);
}

@Component({
  selector: 'oc-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.aria-label]': 'label()',
    class: 'oc-spinner',
    '[class.oc-spinner--lg]': 'size() === "lg"',
  },
  template: ``,
})
export class OcSpinner {
  readonly size = input<'md' | 'lg'>('md');
  readonly label = input('Loading');
}

@Component({
  selector: 'oc-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    class: 'oc-skeleton',
    '[class.oc-skeleton--circle]': 'circle()',
    '[style.width]': 'cssWidth()',
    '[style.height]': 'cssHeight()',
  },
  template: ``,
})
export class OcSkeleton {
  readonly width = input<number | string>();
  readonly height = input<number | string>();
  readonly circle = input(false, { transform: booleanAttribute });
  protected readonly cssHeight = computed(() => toCssSize(this.height()));
  protected readonly cssWidth = computed(() => toCssSize(this.circle() ? (this.height() ?? this.width()) : this.width()));
}

/** Paragraph placeholder. The last line is shorter. Announced once as a loading status. */
@Component({
  selector: 'oc-skeleton-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OcSkeleton],
  host: { role: 'status', 'aria-busy': 'true', class: 'oc-skeleton-text' },
  template: `
    <span class="oc-sr-only">{{ label() }}</span>
    @for (line of lineList(); track line) {
      <oc-skeleton [height]="12" />
    }
  `,
})
export class OcSkeletonText {
  readonly lines = input(3, { transform: numberAttribute });
  readonly label = input('Loading…');
  protected readonly lineList = computed(() => Array.from({ length: this.lines() }, (_, i) => i));
}

/** Card placeholder: avatar, title lines and a body paragraph. */
@Component({
  selector: 'oc-skeleton-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OcSkeleton],
  host: { role: 'status', 'aria-busy': 'true', class: 'oc-skeleton-card' },
  template: `
    <span class="oc-sr-only">{{ label() }}</span>
    <div class="oc-skeleton-card__head">
      <oc-skeleton circle [height]="40" />
      <div class="oc-skeleton-text" aria-hidden="true">
        <oc-skeleton [height]="12" width="50%" />
        <oc-skeleton [height]="10" width="30%" />
      </div>
    </div>
    <div class="oc-skeleton-text" aria-hidden="true">
      @for (line of lineList(); track line) {
        <oc-skeleton [height]="12" />
      }
    </div>
  `,
})
export class OcSkeletonCard {
  readonly lines = input(3, { transform: numberAttribute });
  readonly label = input('Loading…');
  protected readonly lineList = computed(() => Array.from({ length: this.lines() }, (_, i) => i));
}

@Component({
  selector: 'oc-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    class: 'oc-progress',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'clamped()',
    '[class.oc-progress--indeterminate]': 'clamped() === null',
  },
  template: `<div class="oc-progress__bar" [style.width]="clamped() === null ? null : clamped() + '%'"></div>`,
})
export class OcProgressBar {
  /** 0–100. Omit (or null) for an indeterminate bar. */
  readonly value = input<number | null>();
  readonly label = input('Progress');
  protected readonly clamped = computed(() => {
    const v = this.value();
    return v === undefined || v === null ? null : Math.min(100, Math.max(0, v));
  });
}

export interface StepperStep {
  label: string;
  description?: string;
}

/** `current` is the zero-based index of the active step. */
@Component({
  selector: 'oc-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ol class="oc-stepper">
      @for (s of steps(); track $index; let i = $index) {
        <li
          class="oc-stepper__step"
          [attr.data-state]="stateOf(i)"
          [attr.aria-current]="stateOf(i) === 'current' ? 'step' : null"
        >
          <span>{{ s.label }}</span>
          @if (s.description) {
            <span class="oc-stepper__desc">{{ s.description }}</span>
          }
        </li>
      }
    </ol>
  `,
})
export class OcStepper {
  readonly steps = input<StepperStep[]>([]);
  readonly current = input(0, { transform: numberAttribute });
  protected stateOf(i: number): 'complete' | 'current' | 'upcoming' {
    const c = this.current();
    return i < c ? 'complete' : i === c ? 'current' : 'upcoming';
  }
}

export interface TimelineItem {
  title: string;
  description?: string;
  time?: string;
  variant?: 'primary' | Variant;
}

@Component({
  selector: 'oc-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ol class="oc-timeline">
      @for (item of items(); track $index) {
        <li class="oc-timeline__item">
          <span
            aria-hidden="true"
            class="oc-timeline__dot"
            [class]="item.variant && item.variant !== 'primary' ? 'oc-timeline__dot--' + item.variant : ''"
          ></span>
          @if (item.time) {
            <div class="oc-timeline__time">{{ item.time }}</div>
          }
          <div class="oc-timeline__title">{{ item.title }}</div>
          @if (item.description) {
            <div class="oc-timeline__desc">{{ item.description }}</div>
          }
        </li>
      }
    </ol>
  `,
})
export class OcTimeline {
  readonly items = input<TimelineItem[]>([]);
}

/** Danger and warning alerts use role="alert"; info and success use role="status". */
@Component({
  selector: 'oc-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.role]': 'role()', '[class]': 'classes()', '[attr.title]': 'null' },
  template: `
    <div class="oc-alert__body">
      @if (title()) {
        <div class="oc-alert__title">{{ title() }}</div>
      }
      <ng-content />
    </div>
    @if (dismissible()) {
      <button type="button" class="oc-close" [attr.aria-label]="dismissLabel()" (click)="closed.emit()">×</button>
    }
  `,
})
export class OcAlert {
  readonly variant = input<Variant>('info');
  readonly title = input<string>();
  /** Show a dismiss button that emits `closed`. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input('Dismiss');
  readonly closed = output<void>();
  protected readonly role = computed(() => (this.variant() === 'danger' || this.variant() === 'warning' ? 'alert' : 'status'));
  protected readonly classes = computed(() => cx('oc-alert', this.variant() !== 'info' && `oc-alert--${this.variant()}`));
}

/** Action area for an empty state: `<button ocButton ocEmptyAction>…</button>`. */
@Directive({ selector: '[ocEmptyAction]' })
export class OcEmptyAction {}

export type EmptyStateSize = 'compact' | 'default' | 'page';
export type EmptyStateTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Illustrated empty state.
 * Illustration: `illustration="no-results"` (renders `<oc-illustration>`; register it with
 * `import '@orca-ui/illustrations/element'`) or project your own element with the
 * `ocEmptyIllustration` attribute, e.g. `<span ocEmptyIllustration ocIllustration="no-results"></span>`
 * using `OcIllustration` from `@orca-ui/illustrations/angular`.
 * Actions: elements marked `ocEmptyPrimary`, `ocEmptySecondary` or `ocEmptyAction` (in that order).
 */
@Component({
  selector: 'oc-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'classes()', '[attr.title]': 'null' },
  template: `
    <div class="oc-empty__inner">
      <div class="oc-empty__media">
        @if (illustration()) {
          <oc-illustration [attr.name]="illustration()" [attr.compact]="size() === 'compact' ? '' : null"></oc-illustration>
        }
        <ng-content select="[ocEmptyIllustration]" />
      </div>
      @if (icon()) {
        <div class="oc-empty__icon" aria-hidden="true">{{ icon() }}</div>
      }
      <div class="oc-empty__body">
        @switch (headingLevel()) {
          @case (1) { <h1 class="oc-empty__title">{{ title() }}</h1> }
          @case (2) { <h2 class="oc-empty__title">{{ title() }}</h2> }
          @case (4) { <h4 class="oc-empty__title">{{ title() }}</h4> }
          @case (5) { <h5 class="oc-empty__title">{{ title() }}</h5> }
          @case (6) { <h6 class="oc-empty__title">{{ title() }}</h6> }
          @case (false) { <p class="oc-empty__title">{{ title() }}</p> }
          @default { <h3 class="oc-empty__title">{{ title() }}</h3> }
        }
        @if (description()) {
          <p class="oc-empty__desc">{{ description() }}</p>
        }
        <ng-content />
        <div class="oc-empty__actions oc-empty__action">
          <ng-content select="[ocEmptyPrimary]" />
          <ng-content select="[ocEmptySecondary]" />
          <ng-content select="[ocEmptyAction]" />
        </div>
      </div>
    </div>
  `,
})
export class OcEmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
  /** Decorative icon text (emoji or glyph). */
  readonly icon = input<string>();
  /** Scene name from @orca-ui/illustrations, rendered as `<oc-illustration>`. */
  readonly illustration = input<string | false>();
  readonly size = input<EmptyStateSize>('default');
  readonly align = input<'center' | 'start'>('center');
  /** `split` puts the illustration beside the text when the component is ≥ 36rem wide. */
  readonly layout = input<'stack' | 'split'>('stack');
  /** Retints the illustration (danger for error states). */
  readonly tone = input<EmptyStateTone>();
  /** Heading level for the title (default 3); `false` renders a paragraph. */
  readonly headingLevel = input<1 | 2 | 3 | 4 | 5 | 6 | false>(3);
  protected readonly action = contentChild(OcEmptyAction);
  protected readonly classes = computed(() =>
    cx(
      'oc-empty',
      this.size() !== 'default' && `oc-empty--${this.size()}`,
      this.align() === 'start' && 'oc-empty--start',
      this.layout() === 'split' && 'oc-empty--split',
      this.tone() && `oc-empty--tone-${this.tone()}`,
    ),
  );
}

@Component({
  selector: 'oc-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<hr class="oc-divider" />`,
})
export class OcDivider {}
