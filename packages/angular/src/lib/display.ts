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
  selector: 'pl-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class PlBadge {
  readonly variant = input<BadgeVariant>('neutral');
  protected readonly classes = computed(() => cx('pl-badge', this.variant() !== 'neutral' && `pl-badge--${this.variant()}`));
}

@Component({
  selector: 'pl-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pl-tag' },
  template: `<ng-content />
    @if (removable()) {
      <button type="button" class="pl-tag__remove" [attr.aria-label]="removeLabel()" (click)="removed.emit()">×</button>
    }`,
})
export class PlTag {
  readonly removable = input(false, { transform: booleanAttribute });
  readonly removeLabel = input('Remove');
  readonly removed = output<void>();
}

@Component({
  selector: 'pl-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'name()', '[class]': 'classes()' },
  template: `@if (src()) {<img [src]="src()" alt="" />} @else {{{ initials() }}}`,
})
export class PlAvatar {
  /** Used for the accessible name and initials when no image is given. */
  readonly name = input.required<string>();
  readonly src = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly classes = computed(() => cx('pl-avatar', this.size() !== 'md' && `pl-avatar--${this.size()}`));
}

/** Optional custom header content: `<span plCardHeader>…</span>`. */
@Directive({ selector: '[plCardHeader]' })
export class PlCardHeader {}

/** Optional footer content: `<div plCardFooter>…</div>`. */
@Directive({ selector: '[plCardFooter]' })
export class PlCardFooter {}

@Component({
  selector: 'pl-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '[attr.title]': 'null' },
  template: `
    <article class="pl-card">
      @if (title() || header()) {
        <header class="pl-card__header">{{ title() }}<ng-content select="[plCardHeader]" /></header>
      }
      <div class="pl-card__body"><ng-content /></div>
      @if (footer()) {
        <footer class="pl-card__footer"><ng-content select="[plCardFooter]" /></footer>
      }
    </article>
  `,
})
export class PlCard {
  readonly title = input<string>();
  protected readonly header = contentChild(PlCardHeader);
  protected readonly footer = contentChild(PlCardFooter);
}

@Component({
  selector: 'pl-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.aria-label]': 'label()',
    class: 'pl-spinner',
    '[class.pl-spinner--lg]': 'size() === "lg"',
  },
  template: ``,
})
export class PlSpinner {
  readonly size = input<'md' | 'lg'>('md');
  readonly label = input('Loading');
}

@Component({
  selector: 'pl-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    class: 'pl-skeleton',
    '[class.pl-skeleton--circle]': 'circle()',
    '[style.width]': 'cssWidth()',
    '[style.height]': 'cssHeight()',
  },
  template: ``,
})
export class PlSkeleton {
  readonly width = input<number | string>();
  readonly height = input<number | string>();
  readonly circle = input(false, { transform: booleanAttribute });
  protected readonly cssHeight = computed(() => toCssSize(this.height()));
  protected readonly cssWidth = computed(() => toCssSize(this.circle() ? (this.height() ?? this.width()) : this.width()));
}

/** Paragraph placeholder. The last line is shorter. Announced once as a loading status. */
@Component({
  selector: 'pl-skeleton-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PlSkeleton],
  host: { role: 'status', 'aria-busy': 'true', class: 'pl-skeleton-text' },
  template: `
    <span class="pl-sr-only">{{ label() }}</span>
    @for (line of lineList(); track line) {
      <pl-skeleton [height]="12" />
    }
  `,
})
export class PlSkeletonText {
  readonly lines = input(3, { transform: numberAttribute });
  readonly label = input('Loading…');
  protected readonly lineList = computed(() => Array.from({ length: this.lines() }, (_, i) => i));
}

/** Card placeholder: avatar, title lines and a body paragraph. */
@Component({
  selector: 'pl-skeleton-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PlSkeleton],
  host: { role: 'status', 'aria-busy': 'true', class: 'pl-skeleton-card' },
  template: `
    <span class="pl-sr-only">{{ label() }}</span>
    <div class="pl-skeleton-card__head">
      <pl-skeleton circle [height]="40" />
      <div class="pl-skeleton-text" aria-hidden="true">
        <pl-skeleton [height]="12" width="50%" />
        <pl-skeleton [height]="10" width="30%" />
      </div>
    </div>
    <div class="pl-skeleton-text" aria-hidden="true">
      @for (line of lineList(); track line) {
        <pl-skeleton [height]="12" />
      }
    </div>
  `,
})
export class PlSkeletonCard {
  readonly lines = input(3, { transform: numberAttribute });
  readonly label = input('Loading…');
  protected readonly lineList = computed(() => Array.from({ length: this.lines() }, (_, i) => i));
}

@Component({
  selector: 'pl-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    class: 'pl-progress',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'clamped()',
    '[class.pl-progress--indeterminate]': 'clamped() === null',
  },
  template: `<div class="pl-progress__bar" [style.width]="clamped() === null ? null : clamped() + '%'"></div>`,
})
export class PlProgressBar {
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
  selector: 'pl-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ol class="pl-stepper">
      @for (s of steps(); track $index; let i = $index) {
        <li
          class="pl-stepper__step"
          [attr.data-state]="stateOf(i)"
          [attr.aria-current]="stateOf(i) === 'current' ? 'step' : null"
        >
          <span>{{ s.label }}</span>
          @if (s.description) {
            <span class="pl-stepper__desc">{{ s.description }}</span>
          }
        </li>
      }
    </ol>
  `,
})
export class PlStepper {
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
  selector: 'pl-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ol class="pl-timeline">
      @for (item of items(); track $index) {
        <li class="pl-timeline__item">
          <span
            aria-hidden="true"
            class="pl-timeline__dot"
            [class]="item.variant && item.variant !== 'primary' ? 'pl-timeline__dot--' + item.variant : ''"
          ></span>
          @if (item.time) {
            <div class="pl-timeline__time">{{ item.time }}</div>
          }
          <div class="pl-timeline__title">{{ item.title }}</div>
          @if (item.description) {
            <div class="pl-timeline__desc">{{ item.description }}</div>
          }
        </li>
      }
    </ol>
  `,
})
export class PlTimeline {
  readonly items = input<TimelineItem[]>([]);
}

/** Danger and warning alerts use role="alert"; info and success use role="status". */
@Component({
  selector: 'pl-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.role]': 'role()', '[class]': 'classes()', '[attr.title]': 'null' },
  template: `
    <div class="pl-alert__body">
      @if (title()) {
        <div class="pl-alert__title">{{ title() }}</div>
      }
      <ng-content />
    </div>
    @if (dismissible()) {
      <button type="button" class="pl-close" [attr.aria-label]="dismissLabel()" (click)="closed.emit()">×</button>
    }
  `,
})
export class PlAlert {
  readonly variant = input<Variant>('info');
  readonly title = input<string>();
  /** Show a dismiss button that emits `closed`. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input('Dismiss');
  readonly closed = output<void>();
  protected readonly role = computed(() => (this.variant() === 'danger' || this.variant() === 'warning' ? 'alert' : 'status'));
  protected readonly classes = computed(() => cx('pl-alert', this.variant() !== 'info' && `pl-alert--${this.variant()}`));
}

/** Action area for an empty state: `<button plButton plEmptyAction>…</button>`. */
@Directive({ selector: '[plEmptyAction]' })
export class PlEmptyAction {}

export type EmptyStateSize = 'compact' | 'default' | 'page';
export type EmptyStateTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Illustrated empty state.
 * Illustration: `illustration="no-results"` (renders `<pl-illustration>`; register it with
 * `import '@pelagic-ui/illustrations/element'`) or project your own element with the
 * `plEmptyIllustration` attribute, e.g. `<span plEmptyIllustration plIllustration="no-results"></span>`
 * using `PlIllustration` from `@pelagic-ui/illustrations/angular`.
 * Actions: elements marked `plEmptyPrimary`, `plEmptySecondary` or `plEmptyAction` (in that order).
 */
@Component({
  selector: 'pl-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class]': 'classes()', '[attr.title]': 'null' },
  template: `
    <div class="pl-empty__inner">
      <div class="pl-empty__media">
        @if (illustration()) {
          <pl-illustration [attr.name]="illustration()" [attr.compact]="size() === 'compact' ? '' : null"></pl-illustration>
        }
        <ng-content select="[plEmptyIllustration]" />
      </div>
      @if (icon()) {
        <div class="pl-empty__icon" aria-hidden="true">{{ icon() }}</div>
      }
      <div class="pl-empty__body">
        @switch (headingLevel()) {
          @case (1) { <h1 class="pl-empty__title">{{ title() }}</h1> }
          @case (2) { <h2 class="pl-empty__title">{{ title() }}</h2> }
          @case (4) { <h4 class="pl-empty__title">{{ title() }}</h4> }
          @case (5) { <h5 class="pl-empty__title">{{ title() }}</h5> }
          @case (6) { <h6 class="pl-empty__title">{{ title() }}</h6> }
          @case (false) { <p class="pl-empty__title">{{ title() }}</p> }
          @default { <h3 class="pl-empty__title">{{ title() }}</h3> }
        }
        @if (description()) {
          <p class="pl-empty__desc">{{ description() }}</p>
        }
        <ng-content />
        <div class="pl-empty__actions pl-empty__action">
          <ng-content select="[plEmptyPrimary]" />
          <ng-content select="[plEmptySecondary]" />
          <ng-content select="[plEmptyAction]" />
        </div>
      </div>
    </div>
  `,
})
export class PlEmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
  /** Decorative icon text (emoji or glyph). */
  readonly icon = input<string>();
  /** Scene name from @pelagic-ui/illustrations, rendered as `<pl-illustration>`. */
  readonly illustration = input<string | false>();
  readonly size = input<EmptyStateSize>('default');
  readonly align = input<'center' | 'start'>('center');
  /** `split` puts the illustration beside the text when the component is ≥ 36rem wide. */
  readonly layout = input<'stack' | 'split'>('stack');
  /** Retints the illustration (danger for error states). */
  readonly tone = input<EmptyStateTone>();
  /** Heading level for the title (default 3); `false` renders a paragraph. */
  readonly headingLevel = input<1 | 2 | 3 | 4 | 5 | 6 | false>(3);
  protected readonly action = contentChild(PlEmptyAction);
  protected readonly classes = computed(() =>
    cx(
      'pl-empty',
      this.size() !== 'default' && `pl-empty--${this.size()}`,
      this.align() === 'start' && 'pl-empty--start',
      this.layout() === 'split' && 'pl-empty--split',
      this.tone() && `pl-empty--tone-${this.tone()}`,
    ),
  );
}

@Component({
  selector: 'pl-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<hr class="pl-divider" />`,
})
export class PlDivider {}
