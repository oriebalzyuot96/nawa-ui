import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  numberAttribute,
  signal,
  type ModelSignal,
  type Provider,
  type Type,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { nwId } from './utils';

function valueAccessor(type: () => Type<unknown>): Provider {
  return { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(type), multi: true };
}

/**
 * Shared ControlValueAccessor plumbing: `value` is a model() signal, `disabled` merges the
 * input with the state pushed by Angular forms, and label / hint / error are wired with
 * aria-describedby and aria-invalid exactly like the React and Vue packages.
 */
// The id moves to the native control, so drop it from the host to avoid duplicate ids.
@Directive({ host: { '[attr.id]': 'null' } })
export abstract class NwFormControl<T> implements ControlValueAccessor {
  abstract readonly value: ModelSignal<T>;

  readonly label = input<string>();
  readonly hint = input<string>();
  /** Error message. Sets aria-invalid and replaces the hint. */
  readonly error = input<string>();
  readonly id = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly autoId = nwId('nw-field');
  private readonly formDisabled = signal(false);
  private onChange: (value: T) => void = () => {};
  private onTouched: () => void = () => {};

  readonly controlId = computed(() => this.id() ?? this.autoId);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  readonly invalid = computed(() => !!this.error());
  readonly messageId = computed(() => {
    if (this.error()) return `${this.controlId()}-err`;
    if (this.hint()) return `${this.controlId()}-hint`;
    return null;
  });

  writeValue(value: T | null | undefined): void {
    this.value.set(this.normalize(value));
  }
  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  /** Update from user interaction: sets the model and notifies forms. */
  protected commit(value: T): void {
    this.value.set(value);
    this.onChange(value);
  }
  protected touch(): void {
    this.onTouched();
  }
  protected abstract normalize(value: T | null | undefined): T;
}

const MESSAGE = `
  @if (error()) {
    <span [id]="controlId() + '-err'" class="nw-error-text">{{ error() }}</span>
  } @else if (hint()) {
    <span [id]="controlId() + '-hint'" class="nw-hint">{{ hint() }}</span>
  }`;

const FIELD_HOST = { class: 'nw-field', '[class.nw-field--error]': 'invalid()' };

/** Text input with label, hint and error. Works with ngModel and reactive forms. */
@Component({
  selector: 'nw-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [valueAccessor(() => NwInput)],
  host: FIELD_HOST,
  template: `
    @if (label()) {
      <label class="nw-label" [for]="controlId()">{{ label() }}</label>
    }
    <input
      class="nw-input"
      [id]="controlId()"
      [type]="type()"
      [value]="value()"
      [disabled]="isDisabled()"
      [readOnly]="readonly()"
      [required]="required()"
      [attr.name]="name() ?? null"
      [attr.placeholder]="placeholder() ?? null"
      [attr.autocomplete]="autocomplete() ?? null"
      [attr.inputmode]="inputmode() ?? null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="messageId()"
      (input)="onInput($event)"
      (blur)="touch()"
    />
    ${MESSAGE}
  `,
})
export class NwInput extends NwFormControl<string> {
  readonly value = model<string>('');
  readonly type = input<string>('text');
  readonly name = input<string>();
  readonly placeholder = input<string>();
  readonly autocomplete = input<string>();
  readonly inputmode = input<string>();
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  protected normalize(value: string | null | undefined): string {
    return value ?? '';
  }
  protected onInput(event: Event): void {
    this.commit((event.target as HTMLInputElement).value);
  }
}

/** Multi-line text input with label, hint and error. */
@Component({
  selector: 'nw-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [valueAccessor(() => NwTextarea)],
  host: FIELD_HOST,
  template: `
    @if (label()) {
      <label class="nw-label" [for]="controlId()">{{ label() }}</label>
    }
    <textarea
      class="nw-textarea"
      [id]="controlId()"
      [value]="value()"
      [rows]="rows()"
      [disabled]="isDisabled()"
      [readOnly]="readonly()"
      [required]="required()"
      [attr.name]="name() ?? null"
      [attr.placeholder]="placeholder() ?? null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="messageId()"
      (input)="onInput($event)"
      (blur)="touch()"
    ></textarea>
    ${MESSAGE}
  `,
})
export class NwTextarea extends NwFormControl<string> {
  readonly value = model<string>('');
  readonly rows = input(3, { transform: numberAttribute });
  readonly name = input<string>();
  readonly placeholder = input<string>();
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  protected normalize(value: string | null | undefined): string {
    return value ?? '';
  }
  protected onInput(event: Event): void {
    this.commit((event.target as HTMLTextAreaElement).value);
  }
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/** Native select for full keyboard and screen-reader support. */
@Component({
  selector: 'nw-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [valueAccessor(() => NwSelect)],
  host: FIELD_HOST,
  template: `
    @if (label()) {
      <label class="nw-label" [for]="controlId()">{{ label() }}</label>
    }
    <select
      class="nw-select"
      [id]="controlId()"
      [disabled]="isDisabled()"
      [required]="required()"
      [attr.name]="name() ?? null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="messageId()"
      (change)="onSelect($event)"
      (blur)="touch()"
    >
      @if (placeholder()) {
        <option value="" [selected]="value() === ''">{{ placeholder() }}</option>
      }
      @for (o of options(); track o.value) {
        <option [value]="o.value" [disabled]="!!o.disabled" [selected]="o.value === value()">{{ o.label }}</option>
      }
    </select>
    ${MESSAGE}
  `,
})
export class NwSelect extends NwFormControl<string> {
  readonly value = model<string>('');
  readonly options = input<SelectOption[]>([]);
  readonly placeholder = input<string>();
  readonly name = input<string>();
  readonly required = input(false, { transform: booleanAttribute });

  protected normalize(value: string | null | undefined): string {
    return value ?? '';
  }
  protected onSelect(event: Event): void {
    this.commit((event.target as HTMLSelectElement).value);
  }
}

/** Checkbox with a visible label (text via `label` or projected content). Value is boolean. */
@Component({
  selector: 'nw-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [valueAccessor(() => NwCheckbox)],
  host: { '[class.nw-field]': '!!messageId()', '[class.nw-field--error]': 'invalid()' },
  template: `
    <label class="nw-check" [class.nw-check--disabled]="isDisabled()">
      <input
        type="checkbox"
        [id]="controlId()"
        [checked]="value()"
        [indeterminate]="indeterminate()"
        [disabled]="isDisabled()"
        [required]="required()"
        [attr.name]="name() ?? null"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="messageId()"
        (change)="onToggle($event)"
        (blur)="touch()"
      />
      {{ label() }}<ng-content />
    </label>
    ${MESSAGE}
  `,
})
export class NwCheckbox extends NwFormControl<boolean> {
  readonly value = model<boolean>(false);
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly required = input(false, { transform: booleanAttribute });

  protected normalize(value: boolean | null | undefined): boolean {
    return !!value;
  }
  protected onToggle(event: Event): void {
    this.commit((event.target as HTMLInputElement).checked);
  }
}

/** On/off switch (role="switch"). `label` is the accessible name. Value is boolean. */
@Component({
  selector: 'nw-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [valueAccessor(() => NwSwitch)],
  host: { '[class.nw-field]': '!!messageId()', '[class.nw-field--error]': 'invalid()' },
  template: `
    <button
      type="button"
      role="switch"
      class="nw-switch"
      [id]="controlId()"
      [attr.aria-checked]="value() ? 'true' : 'false'"
      [attr.aria-label]="label() ?? null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="messageId()"
      [disabled]="isDisabled()"
      (click)="toggle()"
      (blur)="touch()"
    ></button>
    ${MESSAGE}
  `,
})
export class NwSwitch extends NwFormControl<boolean> {
  readonly value = model<boolean>(false);

  protected normalize(value: boolean | null | undefined): boolean {
    return !!value;
  }
  toggle(): void {
    if (this.isDisabled()) return;
    this.commit(!this.value());
  }
}

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/** Group of native radio inputs (arrow keys handled by the browser). */
@Component({
  selector: 'nw-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [valueAccessor(() => NwRadioGroup)],
  host: { '[class.nw-field]': '!!messageId()', '[class.nw-field--error]': 'invalid()' },
  template: `
    <div
      role="radiogroup"
      class="nw-radio-group"
      [id]="controlId()"
      [attr.aria-label]="label() ?? null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="messageId()"
    >
      @for (o of options(); track o.value) {
        <label class="nw-check" [class.nw-check--disabled]="isDisabled() || !!o.disabled">
          <input
            type="radio"
            [name]="groupName()"
            [value]="o.value"
            [checked]="value() === o.value"
            [disabled]="isDisabled() || !!o.disabled"
            (change)="commit(o.value)"
            (blur)="touch()"
          />
          {{ o.label }}
        </label>
      }
    </div>
    ${MESSAGE}
  `,
})
export class NwRadioGroup extends NwFormControl<string | null> {
  readonly value = model<string | null>(null);
  readonly options = input<RadioOption[]>([]);
  readonly name = input<string>();
  private readonly autoName = nwId('nw-radio');
  protected readonly groupName = computed(() => this.name() ?? this.autoName);

  protected normalize(value: string | null | undefined): string | null {
    return value ?? null;
  }
}

export interface SegmentedOption {
  label: string;
  value: string;
}

/** Single-choice segmented control. Arrow keys / Home / End move and select (roving tabindex). */
@Component({
  selector: 'nw-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [valueAccessor(() => NwSegmented)],
  host: { '[class.nw-field]': '!!messageId()', '[class.nw-field--error]': 'invalid()' },
  template: `
    <div
      role="radiogroup"
      class="nw-segmented"
      [id]="controlId()"
      [attr.aria-label]="label() ?? null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="messageId()"
    >
      @for (o of options(); track o.value; let i = $index) {
        <button
          type="button"
          role="radio"
          class="nw-segmented__item"
          [attr.aria-checked]="o.value === value() ? 'true' : 'false'"
          [tabIndex]="tabStop() === o.value ? 0 : -1"
          [disabled]="isDisabled()"
          (click)="commit(o.value)"
          (keydown)="onKeydown($event, i)"
          (blur)="touch()"
        >
          {{ o.label }}
        </button>
      }
    </div>
    ${MESSAGE}
  `,
})
export class NwSegmented extends NwFormControl<string | null> {
  readonly value = model<string | null>(null);
  readonly options = input<SegmentedOption[]>([]);

  /** The checked item is the tab stop; the first item when nothing is checked. */
  protected readonly tabStop = computed(() => {
    const v = this.value();
    const opts = this.options();
    return opts.some((o) => o.value === v) ? v : (opts[0]?.value ?? null);
  });

  protected normalize(value: string | null | undefined): string | null {
    return value ?? null;
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const opts = this.options();
    const count = opts.length;
    if (!count) return;
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % count;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    this.commit(opts[next].value);
    const group = (event.currentTarget as HTMLElement).parentElement;
    (group?.children[next] as HTMLElement | undefined)?.focus();
  }
}

/** Range slider with a visible label and optional value readout. */
@Component({
  selector: 'nw-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [valueAccessor(() => NwSlider)],
  host: FIELD_HOST,
  template: `
    @if (label()) {
      <label class="nw-label" [for]="controlId()">
        {{ label() }}
        @if (showValue()) {
          <span class="nw-hint"> {{ value() }}</span>
        }
      </label>
    }
    <input
      type="range"
      class="nw-slider"
      [id]="controlId()"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [value]="value()"
      [disabled]="isDisabled()"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="messageId()"
      (input)="onInput($event)"
      (blur)="touch()"
    />
    ${MESSAGE}
  `,
})
export class NwSlider extends NwFormControl<number> {
  readonly value = model<number>(0);
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  readonly showValue = input(false, { transform: booleanAttribute });

  protected normalize(value: number | null | undefined): number {
    return typeof value === 'number' && !Number.isNaN(value) ? value : this.min();
  }
  protected onInput(event: Event): void {
    this.commit(Number((event.target as HTMLInputElement).value));
  }
}
