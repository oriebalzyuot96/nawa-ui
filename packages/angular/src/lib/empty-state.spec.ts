import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlEmptyAction, PlEmptyState, type EmptyStateSize, type EmptyStateTone } from './display';

describe('PlEmptyState', () => {
  @Component({
    imports: [PlEmptyState, PlEmptyAction],
    template: `
      <pl-empty-state
        title="No results"
        description="Try another search"
        [size]="size()"
        [tone]="tone()"
        [align]="align()"
        [layout]="layout()"
        [headingLevel]="level()"
        [illustration]="illustration()"
      >
        <span plEmptyIllustration class="art" aria-hidden="true"></span>
        <button plEmptyAction>Legacy</button>
        <button plEmptySecondary>Help</button>
        <button plEmptyPrimary>Clear</button>
      </pl-empty-state>
    `,
  })
  class Host {
    size = signal<EmptyStateSize>('default');
    tone = signal<EmptyStateTone | undefined>(undefined);
    align = signal<'center' | 'start'>('center');
    layout = signal<'stack' | 'split'>('stack');
    level = signal<1 | 2 | 3 | 4 | 5 | 6 | false>(3);
    illustration = signal<string | false | undefined>(undefined);
  }

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('pl-empty-state');
    return { fixture, host: fixture.componentInstance, el };
  }

  it('renders an h3 title, description and actions in primary → secondary → action order', () => {
    const { el } = setup();
    expect(el.className).toBe('pl-empty');
    expect(el.querySelector('h3.pl-empty__title')?.textContent).toBe('No results');
    expect(el.querySelector('.pl-empty__desc')?.textContent).toBe('Try another search');
    expect([...el.querySelectorAll('.pl-empty__actions button')].map((b) => b.textContent)).toEqual(['Clear', 'Help', 'Legacy']);
    expect(el.querySelector('.pl-empty__media .art')).not.toBeNull();
  });

  it('maps size, align, layout, tone and heading level', () => {
    const { fixture, host, el } = setup();
    host.size.set('page');
    host.align.set('start');
    host.layout.set('split');
    host.tone.set('danger');
    host.level.set(1);
    fixture.detectChanges();
    expect([...el.classList].sort()).toEqual(['pl-empty', 'pl-empty--page', 'pl-empty--split', 'pl-empty--start', 'pl-empty--tone-danger']);
    expect(el.querySelector('h1.pl-empty__title')?.textContent).toBe('No results');
    host.level.set(false);
    fixture.detectChanges();
    expect(el.querySelector('p.pl-empty__title')).not.toBeNull();
    expect(el.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('renders a scene name as <pl-illustration>', () => {
    const { fixture, host, el } = setup();
    host.illustration.set('no-results');
    host.size.set('compact');
    fixture.detectChanges();
    const art = el.querySelector('.pl-empty__media pl-illustration');
    expect(art?.getAttribute('name')).toBe('no-results');
    expect(art?.hasAttribute('compact')).toBe(true);
  });
});
