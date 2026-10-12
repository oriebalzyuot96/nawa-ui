# @orca-ui/angular

**Orca UI for Angular** — an accessible, themeable UI component library built as standalone components on signals (`input()`, `model()`, `output()`), OnPush and zoneless-ready. WCAG 2.2 AA, 21 themes (light, dark, high contrast × 7 accents), skeleton loaders and full RTL support. Same components and markup as the React, Vue, Svelte and Astro packages.

- Docs and live preview: https://oriebalzyuot96.github.io/orca-ui/
- Components: https://oriebalzyuot96.github.io/orca-ui/components/
- Themes: https://oriebalzyuot96.github.io/orca-ui/themes/

Requires Angular 20, 21 or 22.

## Install

```bash
npm i @orca-ui/angular @orca-ui/core
# or
yarn add @orca-ui/angular @orca-ui/core
# or
pnpm add @orca-ui/angular @orca-ui/core
```

Add the stylesheet once, in `angular.json` → `styles`:

```json
"styles": ["node_modules/@orca-ui/core/orca-ui.css", "src/styles.css"]
```

or in your global stylesheet: `@import '@orca-ui/core/style.css';`

## Usage

Every component is standalone — import what you use, or everything with `ORCA_UI`.

```ts
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OcButton, OcDialog, OcDialogFooter, OcInput, OcToastService, OcToaster } from '@orca-ui/angular';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, OcButton, OcInput, OcDialog, OcDialogFooter, OcToaster],
  template: `
    <oc-input label="Email" hint="We never share it" [formControl]="email" [error]="emailError()" />
    <button ocButton (click)="open.set(true)">Edit profile</button>

    <oc-dialog [(open)]="open" title="Edit profile">
      <p>…</p>
      <div ocDialogFooter>
        <button ocButton variant="ghost" (click)="open.set(false)">Cancel</button>
        <button ocButton (click)="save()">Save</button>
      </div>
    </oc-dialog>

    <oc-toaster />
  `,
})
export class App {
  private readonly toasts = inject(OcToastService);
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
| Button | `button[ocButton]`, `a[ocButton]` — `variant`, `size`, `loading`, `block`, `iconOnly` |
| Input, Textarea, Select | `oc-input`, `oc-textarea`, `oc-select` |
| Checkbox, Switch, RadioGroup | `oc-checkbox`, `oc-switch`, `oc-radio-group` |
| Segmented, Slider | `oc-segmented`, `oc-slider` |
| Badge, Tag, Avatar | `oc-badge`, `oc-tag`, `oc-avatar` |
| Card | `oc-card` (+ `[ocCardHeader]`, `[ocCardFooter]`) |
| Alert, EmptyState, Divider | `oc-alert`, `oc-empty-state` (+ `[ocEmptyAction]`), `oc-divider` |
| Spinner, Skeleton | `oc-spinner`, `oc-skeleton`, `oc-skeleton-text`, `oc-skeleton-card` |
| ProgressBar, Stepper, Timeline | `oc-progress-bar`, `oc-stepper`, `oc-timeline` |
| Tooltip | `[ocTooltip]` directive |
| Tabs | `oc-tabs` + `<ng-template ocTabPanel="key">` |
| Accordion | `oc-accordion` (+ optional `<ng-template ocAccordionPanel="key">`) |
| Breadcrumb, Pagination | `oc-breadcrumb`, `oc-pagination` (`[(page)]`) |
| DataTable | `oc-data-table` + `<ng-template ocCell="key" let-row>` |
| Dialog, Drawer | `oc-dialog`, `oc-drawer` (`[(open)]`, `[ocDialogFooter]`) |
| Toast | `OcToastService` + `<oc-toaster />` |

### Forms

All form controls implement `ControlValueAccessor`: use them with `formControl`, `formControlName` or `ngModel`, or bind `[(value)]` directly. `label`, `hint` and `error` are wired with `aria-describedby` and `aria-invalid`; disabling the form control disables the component.

```html
<oc-select label="Country" placeholder="Choose…" [options]="countries" formControlName="country" />
<oc-switch label="Email notifications" [(ngModel)]="notify" />
<oc-segmented label="View" [options]="views" [(value)]="view" />
```

### DataTable

```html
<oc-data-table caption="Team" [columns]="columns" [rows]="people()" [loading]="loading()" (sortChange)="onSort($event)">
  <ng-template ocCell="status" let-row>
    <oc-badge [variant]="row.active ? 'success' : 'neutral'">{{ row.active ? 'Active' : 'Away' }}</oc-badge>
  </ng-template>
</oc-data-table>
```

### Tabs and Tooltip

```html
<oc-tabs label="Settings" [tabs]="[{ key: 'profile', label: 'Profile' }, { key: 'billing', label: 'Billing' }]">
  <ng-template ocTabPanel="profile">Profile settings</ng-template>
  <ng-template ocTabPanel="billing">Billing settings</ng-template>
</oc-tabs>

<button ocButton iconOnly aria-label="Copy link" ocTooltip="Copy link">⧉</button>
```

## Theming

Apply a theme when the app starts:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideOrcaTheme } from '@orca-ui/angular';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection(), provideOrcaTheme({ mode: 'system', accent: 'teal', shape: 'default' })],
});
```

- `mode`: `'light' | 'dark' | 'hc' | 'system'` (`system` follows the OS dark mode and high-contrast settings)
- `accent`: `'violet' | 'teal' | 'indigo' | 'rose' | 'amber' | 'emerald' | 'slate'`
- `shape`: `'sharp' | 'default' | 'round'`

A previously saved choice wins over these defaults (pass `restoreSaved: false` to disable). Change the theme at runtime with `OrcaThemeService`:

```ts
const theme = inject(OrcaThemeService);
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
