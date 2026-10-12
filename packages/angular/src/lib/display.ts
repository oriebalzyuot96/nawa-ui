import {
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
  selector: 'nw-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class NwBadge {
  readonly variant = input<BadgeVariant>('neutral');
  protected readonly classes = computed(() => cx('nw-badge', this.variant() !== 'neutral' && `nw-badge--${this.variant()}`));
}

@Component({
  selector: 'nw-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'nw-tag' },
  template: `<ng-content />
    @if (removable()) {
      <button type="button" class="nw-tag__remove" [attr.aria-label]="removeLabel()" (click)="removed.emit()">×</button>
    }`,
})
export class NwTag {
  readonly removable = input(false, { transform: booleanAttribute });
  readonly removeLabel = input('Remove');
  readonly removed = output<void>();
}

@Component({
  selector: 'nw-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'name()', '[class]': 'classes()' },
  template: `@if (src()) {<img [src]="src()" alt="" />} @else {{{ initials() }}}`,
})
export class NwAvatar {
  /** Used for the accessible name and initials when no image is given. */
  readonly name = input.required<string>();
  readonly src = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly classes = computed(() => cx('nw-avatar', this.size() !== 'md' && `nw-avatar--${this.size()}`));
}

/** Optional custom header content: `<span nwCardHeader>…</span>`. */
@Directive({ selector: '[nwCardHeader]' })
export class NwCardHeader {}

/** Optional footer content: `<div nwCardFooter>…</div>`. */
@Directive({ selector: '[nwCardFooter]' })
export class NwCardFooter {}

@Component({
  selector: 'nw-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '[attr.title]': 'null' },
  template: `
    <article class="nw-card">
      @if (title() || header()) {
        <header class="nw-card__header">{{ title() }}<ng-content select="[nwCardHeader]" /></header>
      }
      <div class="nw-card__body"><ng-content /></div>
      @if (footer()) {
        <footer class="nw-card__footer"><ng-content select="[nwCardFooter]" /></footer>
      }
    </article>
  `,
})
export class NwCard {
  readonly title = input<string>();
  protected readonly header = contentChild(NwCardHeader);
  protected readonly footer = contentChild(NwCardFooter);
}

@Component({
  selector: 'nw-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.aria-label]': 'label()',
    class: 'nw-spinner',
    '[class.nw-spinner--lg]': 'size() === "lg"',
  },
  template: ``,
})
export class NwSpinner {
  readonly size = input<'md' | 'lg'>('md');
  readonly label = input('Loading');
}

@Component({
  selector: 'nw-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    class: 'nw-skeleton',
    '[class.nw-skeleton--circle]': 'circle()',
    '[style.width]': 'cssWidth()',
    '[style.height]': 'cssHeight()',
  },
  template: ``,
})
export class NwSkeleton {
  readonly width = input<number | string>();
  readonly height = input<number | string>();
  readonly circle = input(false, { transform: booleanAttribute });
  protected readonly cssHeight = computed(() => toCssSize(this.height()));
  protected readonly cssWidth = computed(() => toCssSize(this.circle() ? (this.height() ?? this.width()) : this.width()));
}

/** Paragraph placeholder. The last line is shorter. Announced once as a loading status. */
@Component({
  selector: 'nw-skeleton-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwSkeleton],
  host: { role: 'status', 'aria-busy': 'true', class: 'nw-skeleton-text' },
  template: `
    <span class="nw-sr-only">{{ label() }}</span>
    @for (line of lineList(); track line) {
      <nw-skeleton [height]="12" />
    }
  `,
})
export class NwSkeletonText {
  readonly lines = input(3, { transform: numberAttribute });
  readonly label = input('Loading…');
  protected readonly lineList = computed(() => Array.from({ length: this.lines() }, (_, i) => i));
}

/** Card placeholder: avatar, title lines and a body paragraph. */
@Component({
  selector: 'nw-skeleton-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwSkeleton],
  host: { role: 'status', 'aria-busy': 'true', class: 'nw-skeleton-card' },
  template: `
    <span class="nw-sr-only">{{ label() }}</span>
    <div class="nw-skeleton-card__head">
      <nw-skeleton circle [height]="40" />
      <div class="nw-skeleton-text" aria-hidden="true">
        <nw-skeleton [height]="12" width="50%" />
        <nw-skeleton [height]="10" width="30%" />
      </div>
    </div>
    <div class="nw-skeleton-text" aria-hidden="true">
      @for (line of lineList(); track line) {
        <nw-skeleton [height]="12" />
      }
    </div>
  `,
})
export class NwSkeletonCard {
  readonly lines = input(3, { transform: numberAttribute });
  readonly label = input('Loading…');
  protected readonly lineList = computed(() => Array.from({ length: this.lines() }, (_, i) => i));
}

@Component({
  selector: 'nw-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    class: 'nw-progress',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'clamped()',
    '[class.nw-progress--indeterminate]': 'clamped() === null',
  },
  template: `<div class="nw-progress__bar" [style.width]="clamped() === null ? null : clamped() + '%'"></div>`,
})
export class NwProgressBar {
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
  selector: 'nw-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ol class="nw-stepper">
      @for (s of steps(); track $index; let i = $index) {
        <li
          class="nw-stepper__step"
          [attr.data-state]="stateOf(i)"
          [attr.aria-current]="stateOf(i) === 'current' ? 'step' : null"
        >
          <span>{{ s.label }}</span>
          @if (s.description) {
            <span class="nw-stepper__desc">{{ s.description }}</span>
          }
        </li>
      }
    </ol>
  `,
})
export class NwStepper {
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
  selector: 'nw-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ol class="nw-timeline">
      @for (item of items(); track $index) {
        <li class="nw-timeline__item">
          <span
            aria-hidden="true"
            class="nw-timeline__dot"
            [class]="item.variant && item.variant !== 'primary' ? 'nw-timeline__dot--' + item.variant : ''"
          ></span>
          @if (item.time) {
            <div class="nw-timeline__time">{{ item.time }}</div>
          }
          <div class="nw-timeline__title">{{ item.title }}</div>
          @if (item.description) {
            <div class="nw-timeline__desc">{{ item.description }}</div>
          }
        </li>
      }
    </ol>
  `,
})
export class NwTimeline {
  readonly items = input<TimelineItem[]>([]);
}

/** Danger and warning alerts use role="alert"; info and success use role="status". */
@Component({
  selector: 'nw-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.role]': 'role()', '[class]': 'classes()', '[attr.title]': 'null' },
  template: `
    <div class="nw-alert__body">
      @if (title()) {
        <div class="nw-alert__title">{{ title() }}</div>
      }
      <ng-content />
    </div>
    @if (dismissible()) {
      <button type="button" class="nw-close" [attr.aria-label]="dismissLabel()" (click)="closed.emit()">×</button>
    }
  `,
})
export class NwAlert {
  readonly variant = input<Variant>('info');
  readonly title = input<string>();
  /** Show a dismiss button that emits `closed`. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input('Dismiss');
  readonly closed = output<void>();
  protected readonly role = computed(() => (this.variant() === 'danger' || this.variant() === 'warning' ? 'alert' : 'status'));
  protected readonly classes = computed(() => cx('nw-alert', this.variant() !== 'info' && `nw-alert--${this.variant()}`));
}

/** Action area for an empty state: `<button nwButton nwEmptyAction>…</button>`. */
@Directive({ selector: '[nwEmptyAction]' })
export class NwEmptyAction {}

@Component({
  selector: 'nw-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'nw-empty', '[attr.title]': 'null' },
  template: `
    @if (icon()) {
      <div class="nw-empty__icon" aria-hidden="true">{{ icon() }}</div>
    }
    <div class="nw-empty__title">{{ title() }}</div>
    @if (description()) {
      <p class="nw-empty__desc">{{ description() }}</p>
    }
    <ng-content />
    @if (action()) {
      <div class="nw-empty__action"><ng-content select="[nwEmptyAction]" /></div>
    }
  `,
})
export class NwEmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
  /** Decorative icon text (emoji or glyph). */
  readonly icon = input<string>();
  protected readonly action = contentChild(NwEmptyAction);
}

@Component({
  selector: 'nw-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<hr class="nw-divider" />`,
})
export class NwDivider {}
