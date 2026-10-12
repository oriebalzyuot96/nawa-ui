# @nawa-ui/angular

**Nawa UI for Angular** — an accessible, themeable UI component library built as standalone components on signals (`input()`, `model()`, `output()`), OnPush and zoneless-ready. WCAG 2.2 AA, 21 themes (light, dark, high contrast × 7 accents), skeleton loaders and full RTL support. Same components and markup as the React, Vue, Svelte and Astro packages.

- Docs and live preview: https://oriebalzyuot96.github.io/nawa-ui/
- Components: https://oriebalzyuot96.github.io/nawa-ui/components/
- Themes: https://oriebalzyuot96.github.io/nawa-ui/themes/

Requires Angular 20, 21 or 22.

## Install

```bash
npm i @nawa-ui/angular @nawa-ui/core
# or
yarn add @nawa-ui/angular @nawa-ui/core
# or
pnpm add @nawa-ui/angular @nawa-ui/core
```

Add the stylesheet once, in `angular.json` → `styles`:

```json
"styles": ["node_modules/@nawa-ui/core/nawa-ui.css", "src/styles.css"]
```

or in your global stylesheet: `@import '@nawa-ui/core/style.css';`

## Usage

Every component is standalone — import what you use, or everything with `NAWA_UI`.

```ts
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NwButton, NwDialog, NwDialogFooter, NwInput, NwToastService, NwToaster } from '@nawa-ui/angular';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, NwButton, NwInput, NwDialog, NwDialogFooter, NwToaster],
  template: `
    <nw-input label="Email" hint="We never share it" [formControl]="email" [error]="emailError()" />
    <button nwButton (click)="open.set(true)">Edit profile</button>

    <nw-dialog [(open)]="open" title="Edit profile">
      <p>…</p>
      <div nwDialogFooter>
        <button nwButton variant="ghost" (click)="open.set(false)">Cancel</button>
        <button nwButton (click)="save()">Save</button>
      </div>
    </nw-dialog>

    <nw-toaster />
  `,
})
export class App {
  private readonly toasts = inject(NwToastService);
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
| Button | `button[nwButton]`, `a[nwButton]` — `variant`, `size`, `loading`, `block`, `iconOnly` |
| Input, Textarea, Select | `nw-input`, `nw-textarea`, `nw-select` |
| Checkbox, Switch, RadioGroup | `nw-checkbox`, `nw-switch`, `nw-radio-group` |
| Segmented, Slider | `nw-segmented`, `nw-slider` |
| Badge, Tag, Avatar | `nw-badge`, `nw-tag`, `nw-avatar` |
| Card | `nw-card` (+ `[nwCardHeader]`, `[nwCardFooter]`) |
| Alert, EmptyState, Divider | `nw-alert`, `nw-empty-state` (+ `[nwEmptyAction]`), `nw-divider` |
| Spinner, Skeleton | `nw-spinner`, `nw-skeleton`, `nw-skeleton-text`, `nw-skeleton-card` |
| ProgressBar, Stepper, Timeline | `nw-progress-bar`, `nw-stepper`, `nw-timeline` |
| Tooltip | `[nwTooltip]` directive |
| Tabs | `nw-tabs` + `<ng-template nwTabPanel="key">` |
| Accordion | `nw-accordion` (+ optional `<ng-template nwAccordionPanel="key">`) |
| Breadcrumb, Pagination | `nw-breadcrumb`, `nw-pagination` (`[(page)]`) |
| DataTable | `nw-data-table` + `<ng-template nwCell="key" let-row>` |
| Dialog, Drawer | `nw-dialog`, `nw-drawer` (`[(open)]`, `[nwDialogFooter]`) |
| Toast | `NwToastService` + `<nw-toaster />` |

### Forms

All form controls implement `ControlValueAccessor`: use them with `formControl`, `formControlName` or `ngModel`, or bind `[(value)]` directly. `label`, `hint` and `error` are wired with `aria-describedby` and `aria-invalid`; disabling the form control disables the component.

```html
<nw-select label="Country" placeholder="Choose…" [options]="countries" formControlName="country" />
<nw-switch label="Email notifications" [(ngModel)]="notify" />
<nw-segmented label="View" [options]="views" [(value)]="view" />
```

### DataTable

```html
<nw-data-table caption="Team" [columns]="columns" [rows]="people()" [loading]="loading()" (sortChange)="onSort($event)">
  <ng-template nwCell="status" let-row>
    <nw-badge [variant]="row.active ? 'success' : 'neutral'">{{ row.active ? 'Active' : 'Away' }}</nw-badge>
  </ng-template>
</nw-data-table>
```

### Tabs and Tooltip

```html
<nw-tabs label="Settings" [tabs]="[{ key: 'profile', label: 'Profile' }, { key: 'billing', label: 'Billing' }]">
  <ng-template nwTabPanel="profile">Profile settings</ng-template>
  <ng-template nwTabPanel="billing">Billing settings</ng-template>
</nw-tabs>

<button nwButton iconOnly aria-label="Copy link" nwTooltip="Copy link">⧉</button>
```

## Theming

Apply a theme when the app starts:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNawaTheme } from '@nawa-ui/angular';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection(), provideNawaTheme({ mode: 'system', accent: 'teal', shape: 'default' })],
});
```

- `mode`: `'light' | 'dark' | 'hc' | 'system'` (`system` follows the OS dark mode and high-contrast settings)
- `accent`: `'violet' | 'teal' | 'indigo' | 'rose' | 'amber' | 'emerald' | 'slate'`
- `shape`: `'sharp' | 'default' | 'round'`

A previously saved choice wins over these defaults (pass `restoreSaved: false` to disable). Change the theme at runtime with `NawaThemeService`:

```ts
const theme = inject(NawaThemeService);
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
