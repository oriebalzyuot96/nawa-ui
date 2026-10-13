# @pelagic-ui/angular

**Pelagic UI for Angular** — an accessible, themeable UI component library built as standalone components on signals (`input()`, `model()`, `output()`), OnPush and zoneless-ready. WCAG 2.2 AA, 21 themes (light, dark, high contrast × 7 accents), skeleton loaders and full RTL support. Same components and markup as the React, Vue, Svelte and Astro packages.

- Docs and live preview: https://oriebalzyuot96.github.io/pelagic-ui/
- Components: https://oriebalzyuot96.github.io/pelagic-ui/components/
- Themes: https://oriebalzyuot96.github.io/pelagic-ui/themes/

Requires Angular 20, 21 or 22.

## Install

```bash
npm i @pelagic-ui/angular @pelagic-ui/core
# or
yarn add @pelagic-ui/angular @pelagic-ui/core
# or
pnpm add @pelagic-ui/angular @pelagic-ui/core
```

Add the stylesheet once, in `angular.json` → `styles`:

```json
"styles": ["node_modules/@pelagic-ui/core/pelagic.css", "src/styles.css"]
```

or in your global stylesheet: `@import '@pelagic-ui/core/style.css';`

## Usage

Every component is standalone — import what you use, or everything with `PELAGIC_UI`.

```ts
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PlButton, PlDialog, PlDialogFooter, PlInput, PlToastService, PlToaster } from '@pelagic-ui/angular';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, PlButton, PlInput, PlDialog, PlDialogFooter, PlToaster],
  template: `
    <pl-input label="Email" hint="We never share it" [formControl]="email" [error]="emailError()" />
    <button plButton (click)="open.set(true)">Edit profile</button>

    <pl-dialog [(open)]="open" title="Edit profile">
      <p>…</p>
      <div plDialogFooter>
        <button plButton variant="ghost" (click)="open.set(false)">Cancel</button>
        <button plButton (click)="save()">Save</button>
      </div>
    </pl-dialog>

    <pl-toaster />
  `,
})
export class App {
  private readonly toasts = inject(PlToastService);
  readonly email = new FormControl('', { nonNullable: true });
  readonly emailError = signal<string | undefined>(undefined);
  readonly open = signal(false);

  save() {
    this.open.set(false);
    this.toasts.show({ title: 'Saved', message: 'Your profile is up to date.', variant: 'success' });
  }
}
```

### Components

| Component | Selector |
| --- | --- |
| Button | `button[plButton]`, `a[plButton]` — `variant`, `size`, `loading`, `block`, `iconOnly` |
| Input, Textarea, Select | `pl-input`, `pl-textarea`, `pl-select` |
| Checkbox, Switch, RadioGroup | `pl-checkbox`, `pl-switch`, `pl-radio-group` |
| Segmented, Slider | `pl-segmented`, `pl-slider` |
| Badge, Tag, Avatar | `pl-badge`, `pl-tag`, `pl-avatar` |
| Card | `pl-card` (+ `[plCardHeader]`, `[plCardFooter]`) |
| Alert, EmptyState, Divider | `pl-alert`, `pl-empty-state` (+ `[plEmptyAction]`), `pl-divider` |
| Spinner, Skeleton | `pl-spinner`, `pl-skeleton`, `pl-skeleton-text`, `pl-skeleton-card` |
| ProgressBar, Stepper, Timeline | `pl-progress-bar`, `pl-stepper`, `pl-timeline` |
| Tooltip | `[plTooltip]` directive |
| Tabs | `pl-tabs` + `<ng-template plTabPanel="key">` |
| Accordion | `pl-accordion` (+ optional `<ng-template plAccordionPanel="key">`) |
| Breadcrumb, Pagination | `pl-breadcrumb`, `pl-pagination` (`[(page)]`) |
| DataTable | `pl-data-table` + `<ng-template plCell="key" let-row>` |
| Dialog, Drawer | `pl-dialog`, `pl-drawer` (`[(open)]`, `[plDialogFooter]`) |
| Toast | `PlToastService` + `<pl-toaster />` |

### Forms

All form controls implement `ControlValueAccessor`: use them with `formControl`, `formControlName` or `ngModel`, or bind `[(value)]` directly. `label`, `hint` and `error` are wired with `aria-describedby` and `aria-invalid`; disabling the form control disables the component.

```html
<pl-select label="Country" placeholder="Choose…" [options]="countries" formControlName="country" />
<pl-switch label="Email notifications" [(ngModel)]="notify" />
<pl-segmented label="View" [options]="views" [(value)]="view" />
```

### DataTable

```html
<pl-data-table caption="Team" [columns]="columns" [rows]="people()" [loading]="loading()" (sortChange)="onSort($event)">
  <ng-template plCell="status" let-row>
    <pl-badge [variant]="row.active ? 'success' : 'neutral'">{{ row.active ? 'Active' : 'Away' }}</pl-badge>
  </ng-template>
</pl-data-table>
```

### Tabs and Tooltip

```html
<pl-tabs label="Settings" [tabs]="[{ key: 'profile', label: 'Profile' }, { key: 'billing', label: 'Billing' }]">
  <ng-template plTabPanel="profile">Profile settings</ng-template>
  <ng-template plTabPanel="billing">Billing settings</ng-template>
</pl-tabs>

<button plButton iconOnly aria-label="Copy link" plTooltip="Copy link">⧉</button>
```

## Theming

Apply a theme when the app starts:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { providePelagicTheme } from '@pelagic-ui/angular';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection(), providePelagicTheme({ mode: 'system', accent: 'teal', shape: 'default' })],
});
```

- `mode`: `'light' | 'dark' | 'hc' | 'system'` (`system` follows the OS dark mode and high-contrast settings)
- `accent`: `'violet' | 'teal' | 'indigo' | 'rose' | 'amber' | 'emerald' | 'slate'`
- `shape`: `'sharp' | 'default' | 'round'`

A previously saved choice wins over these defaults (pass `restoreSaved: false` to disable). Change the theme at runtime with `PelagicThemeService`:

```ts
const theme = inject(PelagicThemeService);
theme.set({ mode: 'dark' }, { persist: true }); // applies and saves to localStorage
theme.theme(); // signal of the current choice
```

Themes are plain attributes on `<html>` (`data-theme`, `data-accent`, `data-shape`), so you can also set them in `index.html` to avoid a flash before Angular boots.

## Accessibility

- Dialog and Drawer: `aria-modal`, `aria-labelledby`, focus trap, Escape to close, scroll lock and focus return.
- Tabs and Segmented: arrow keys, Home and End with a roving tabindex.
- Tooltip: `aria-describedby` on the trigger; Escape hides it (WCAG 1.4.13).
- Toasts: polite live region; auto-dismiss pauses while hovered or focused.

MIT © oriebalzyuot96
