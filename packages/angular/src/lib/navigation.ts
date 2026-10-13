import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { getPageItems, plId } from './utils';

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

/** Panel content for a tab: `<ng-template plTabPanel="profile">…</ng-template>`. */
@Directive({ selector: 'ng-template[plTabPanel]' })
export class PlTabPanel {
  readonly key = input.required<string>({ alias: 'plTabPanel' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * WAI-ARIA tabs with automatic activation. Arrow Left/Right, Home and End move focus and
 * select; only the selected tab is in the tab order (roving tabindex).
 */
@Component({
  selector: 'pl-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: { class: 'pl-tabs' },
  template: `
    <div role="tablist" class="pl-tabs__list" [attr.aria-label]="label() ?? null">
      @for (t of tabs(); track t.key; let i = $index) {
        <button
          type="button"
          role="tab"
          class="pl-tabs__tab"
          [id]="baseId + '-tab-' + t.key"
          [attr.aria-selected]="t.key === active() ? 'true' : 'false'"
          [attr.aria-controls]="baseId + '-panel-' + t.key"
          [tabIndex]="t.key === active() ? 0 : -1"
          [disabled]="!!t.disabled"
          (click)="select(t.key)"
          (keydown)="onKeydown($event, i)"
        >
          {{ t.label }}
        </button>
      }
    </div>
    @if (activeTab(); as tab) {
      <div
        role="tabpanel"
        class="pl-tabs__panel"
        tabindex="0"
        [id]="baseId + '-panel-' + tab.key"
        [attr.aria-labelledby]="baseId + '-tab-' + tab.key"
      >
        @if (activePanel(); as panel) {
          <ng-container [ngTemplateOutlet]="panel.template" />
        }
      </div>
    }
  `,
})
export class PlTabs {
  readonly tabs = input<TabItem[]>([]);
  /** Selected tab key. Two-way bindable: `[(value)]`. Defaults to the first enabled tab. */
  readonly value = model<string | undefined>(undefined);
  /** Accessible name for the tab list. */
  readonly label = input<string>();

  protected readonly baseId = plId('pl-tabs');
  protected readonly panels = contentChildren(PlTabPanel);

  readonly active = computed(() => this.value() ?? this.tabs().find((t) => !t.disabled)?.key);
  protected readonly activeTab = computed(() => this.tabs().find((t) => t.key === this.active()));
  protected readonly activePanel = computed(() => this.panels().find((p) => p.key() === this.active()));

  select(key: string): void {
    this.value.set(key);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    const enabled = tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
    if (!enabled.length) return;
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    if (event.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length];
    else if (event.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (event.key === 'Home') next = enabled[0];
    else if (event.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    this.select(tabs[next].key);
    const list = (event.currentTarget as HTMLElement).parentElement;
    (list?.children[next] as HTMLElement | undefined)?.focus();
  }
}

export interface AccordionItem {
  key: string;
  title: string;
  /** Plain-text content. For rich content use `<ng-template plAccordionPanel="key">`. */
  content?: string;
}

/** Rich content for an accordion item: `<ng-template plAccordionPanel="faq-1">…</ng-template>`. */
@Directive({ selector: 'ng-template[plAccordionPanel]' })
export class PlAccordionPanel {
  readonly key = input.required<string>({ alias: 'plAccordionPanel' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

@Component({
  selector: 'pl-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: { class: 'pl-accordion' },
  template: `
    @for (item of items(); track item.key) {
      <div class="pl-accordion__item">
        <h3 [style.margin]="0">
          <button
            type="button"
            class="pl-accordion__trigger"
            [id]="baseId + '-' + item.key + '-trigger'"
            [attr.aria-expanded]="isOpen(item.key) ? 'true' : 'false'"
            [attr.aria-controls]="baseId + '-' + item.key + '-panel'"
            (click)="toggle(item.key)"
          >
            {{ item.title }}
            <span class="pl-accordion__icon" aria-hidden="true">▾</span>
          </button>
        </h3>
        @if (isOpen(item.key)) {
          <div
            role="region"
            class="pl-accordion__panel"
            [id]="baseId + '-' + item.key + '-panel'"
            [attr.aria-labelledby]="baseId + '-' + item.key + '-trigger'"
          >
            @if (panelFor(item.key); as panel) {
              <ng-container [ngTemplateOutlet]="panel.template" />
            } @else {
              {{ item.content }}
            }
          </div>
        }
      </div>
    }
  `,
})
export class PlAccordion {
  readonly items = input<AccordionItem[]>([]);
  /** Allow more than one panel open at once. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Keys of the initially open panels. */
  readonly defaultOpen = input<string[]>([]);
  /** Open keys. Two-way bindable: `[(open)]`. */
  readonly open = model<string[] | undefined>(undefined);

  protected readonly baseId = plId('pl-accordion');
  protected readonly panels = contentChildren(PlAccordionPanel);
  private readonly openKeys = linkedSignal(() => this.open() ?? this.defaultOpen());

  protected isOpen(key: string): boolean {
    return this.openKeys().includes(key);
  }
  protected panelFor(key: string): PlAccordionPanel | undefined {
    return this.panels().find((p) => p.key() === key);
  }

  toggle(key: string): void {
    const prev = this.openKeys();
    const next = prev.includes(key) ? prev.filter((k) => k !== key) : this.multiple() ? [...prev, key] : [key];
    this.openKeys.set(next);
    this.open.set(next);
  }
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

@Component({
  selector: 'pl-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <nav [attr.aria-label]="label()">
      <ol class="pl-breadcrumb">
        @for (item of items(); track $index; let last = $last) {
          <li class="pl-breadcrumb__item" [attr.aria-current]="last ? 'page' : null">
            @if (item.href && !last) {
              <a [href]="item.href">{{ item.label }}</a>
            } @else {
              {{ item.label }}
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class PlBreadcrumb {
  readonly items = input<BreadcrumbItem[]>([]);
  readonly label = input('Breadcrumb');
}

/** Page navigation. `page` is 1-based and two-way bindable: `[(page)]` / `(pageChange)`. */
@Component({
  selector: 'pl-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <nav class="pl-pagination" [attr.aria-label]="label()">
      <button
        type="button"
        class="pl-pagination__btn"
        aria-label="Previous page"
        [disabled]="page() <= 1"
        (click)="go(page() - 1)"
      >
        ‹
      </button>
      @for (item of items(); track $index) {
        @if (item === 'ellipsis') {
          <span class="pl-pagination__ellipsis" aria-hidden="true">…</span>
        } @else {
          <button
            type="button"
            class="pl-pagination__btn"
            [attr.aria-current]="item === page() ? 'page' : null"
            [attr.aria-label]="'Page ' + item"
            (click)="go(item)"
          >
            {{ item }}
          </button>
        }
      }
      <button
        type="button"
        class="pl-pagination__btn"
        aria-label="Next page"
        [disabled]="page() >= pageCount()"
        (click)="go(page() + 1)"
      >
        ›
      </button>
    </nav>
  `,
})
export class PlPagination {
  readonly page = model(1);
  readonly pageCount = input.required({ transform: numberAttribute });
  readonly label = input('Pagination');
  protected readonly items = computed(() => getPageItems(this.page(), this.pageCount()));

  go(page: number): void {
    const next = Math.min(Math.max(1, page), this.pageCount());
    if (next !== this.page()) this.page.set(next);
  }
}
