import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NwButton } from './button';
import { NwInput, NwSegmented, NwSwitch } from './forms';

describe('NwButton', () => {
  @Component({
    imports: [NwButton],
    template: `
      <button nwButton id="primary">Save</button>
      <button nwButton id="outline" variant="outline" size="sm" block iconOnly aria-label="x">x</button>
      <button nwButton id="loading" [loading]="loading()" (click)="clicks = clicks + 1">Go</button>
      <a nwButton id="link" href="/home" variant="ghost">Home</a>
    `,
  })
  class Host {
    loading = signal(false);
    clicks = 0;
  }

  it('renders variant, size and modifier classes', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const primary = el.querySelector('#primary') as HTMLButtonElement;
    expect(primary.className).toBe('nw-btn nw-btn--primary');
    expect(primary.type).toBe('button');
    const outline = el.querySelector('#outline')!;
    expect(outline.classList).toContain('nw-btn--outline');
    expect(outline.classList).toContain('nw-btn--sm');
    expect(outline.classList).toContain('nw-btn--block');
    expect(outline.classList).toContain('nw-btn--icon');
    const link = el.querySelector('#link')!;
    expect(link.className).toBe('nw-btn nw-btn--ghost');
    expect(link.hasAttribute('type')).toBe(false);
  });

  it('shows a spinner, sets aria-busy and disables while loading', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('#loading') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.querySelector('.nw-spinner')).toBeNull();

    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.nw-spinner')?.getAttribute('aria-hidden')).toBe('true');
    button.click();
    expect(fixture.componentInstance.clicks).toBe(0);
  });
});

describe('NwInput', () => {
  @Component({
    imports: [NwInput, ReactiveFormsModule],
    template: `<nw-input label="Email" hint="We never share it" [error]="error()" [formControl]="control" />`,
  })
  class ReactiveHost {
    control = new FormControl('a@b.co', { nonNullable: true });
    error = signal<string | undefined>(undefined);
  }

  it('writes, reads and disables through a reactive FormControl', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input.nw-input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label.nw-label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.value).toBe('a@b.co');

    fixture.componentInstance.control.setValue('x@y.z');
    await fixture.whenStable();
    expect(input.value).toBe('x@y.z');

    input.value = 'typed@site.dev';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('typed@site.dev');

    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });

  it('wires hint and error with aria-describedby and aria-invalid', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('nw-input') as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBeNull();
    const hintId = input.getAttribute('aria-describedby')!;
    expect(fixture.nativeElement.querySelector(`#${hintId}`).textContent).toContain('We never share it');

    fixture.componentInstance.error.set('Enter a valid email');
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(host.classList).toContain('nw-field--error');
    const errId = input.getAttribute('aria-describedby')!;
    expect(errId).toMatch(/-err$/);
    const err = fixture.nativeElement.querySelector(`#${errId}`) as HTMLElement;
    expect(err.className).toBe('nw-error-text');
    expect(err.textContent).toContain('Enter a valid email');
    expect(fixture.nativeElement.querySelector('.nw-hint')).toBeNull();
  });

  @Component({
    imports: [NwInput, FormsModule],
    template: `<nw-input label="Name" [(ngModel)]="name" />`,
  })
  class TemplateHost {
    name = 'Ada';
  }

  it('works with ngModel', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Ada');
    input.value = 'Grace';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.name).toBe('Grace');
  });
});

describe('NwSwitch', () => {
  @Component({
    imports: [NwSwitch, ReactiveFormsModule, FormsModule],
    template: `
      <nw-switch id="a" label="Wi-Fi" [formControl]="control" />
      <nw-switch id="b" label="Dark mode" [(value)]="dark" />
    `,
  })
  class Host {
    control = new FormControl(false, { nonNullable: true });
    dark = signal(true);
  }

  it('toggles a FormControl and reflects aria-checked', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('#a') as HTMLButtonElement;
    expect(button.getAttribute('role')).toBe('switch');
    expect(button.getAttribute('aria-label')).toBe('Wi-Fi');
    expect(button.getAttribute('aria-checked')).toBe('false');

    button.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe(true);
    expect(button.getAttribute('aria-checked')).toBe('true');

    fixture.componentInstance.control.setValue(false);
    await fixture.whenStable();
    expect(button.getAttribute('aria-checked')).toBe('false');

    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });

  it('supports two-way [(value)] binding without forms', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('#b') as HTMLButtonElement;
    expect(button.getAttribute('aria-checked')).toBe('true');
    button.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.dark()).toBe(false);
  });
});

describe('NwSegmented', () => {
  @Component({
    imports: [NwSegmented, FormsModule],
    template: `<nw-segmented label="View" [options]="options" [(ngModel)]="view" />`,
  })
  class Host {
    options = [
      { label: 'List', value: 'list' },
      { label: 'Grid', value: 'grid' },
      { label: 'Map', value: 'map' },
    ];
    view = 'list';
  }

  it('moves selection with arrow keys, Home and End using a roving tabindex', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const radios = Array.from(fixture.nativeElement.querySelectorAll('[role="radio"]')) as HTMLButtonElement[];
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);

    radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.view).toBe('grid');
    expect(document.activeElement).toBe(radios[1]);
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1]);

    radios[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.view).toBe('map');

    radios[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.view).toBe('list');
  });
});
