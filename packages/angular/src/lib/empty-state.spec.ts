import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OcEmptyAction, OcEmptyState, type EmptyStateSize, type EmptyStateTone } from './display';

describe('OcEmptyState', () => {
  @Component({
    imports: [OcEmptyState, OcEmptyAction],
    template: `
      <oc-empty-state
        title="No results"
        description="Try another search"
        [size]="size()"
        [tone]="tone()"
        [align]="align()"
        [layout]="layout()"
        [headingLevel]="level()"
        [illustration]="illustration()"
      >
        <span ocEmptyIllustration class="art" aria-hidden="true"></span>
        <button ocEmptyAction>Legacy</button>
        <button ocEmptySecondary>Help</button>
        <button ocEmptyPrimary>Clear</button>
      </oc-empty-state>
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
    const el: HTMLElement = fixture.nativeElement.querySelector('oc-empty-state');
    return { fixture, host: fixture.componentInstance, el };
  }

  it('renders an h3 title, description and actions in primary → secondary → action order', () => {
    const { el } = setup();
    expect(el.className).toBe('oc-empty');
    expect(el.querySelector('h3.oc-empty__title')?.textContent).toBe('No results');
    expect(el.querySelector('.oc-empty__desc')?.textContent).toBe('Try another search');
    expect([...el.querySelectorAll('.oc-empty__actions button')].map((b) => b.textContent)).toEqual(['Clear', 'Help', 'Legacy']);
    expect(el.querySelector('.oc-empty__media .art')).not.toBeNull();
  });

  it('maps size, align, layout, tone and heading level', () => {
    const { fixture, host, el } = setup();
    host.size.set('page');
    host.align.set('start');
    host.layout.set('split');
    host.tone.set('danger');
    host.level.set(1);
    fixture.detectChanges();
    expect([...el.classList].sort()).toEqual(['oc-empty', 'oc-empty--page', 'oc-empty--split', 'oc-empty--start', 'oc-empty--tone-danger']);
    expect(el.querySelector('h1.oc-empty__title')?.textContent).toBe('No results');
    host.level.set(false);
    fixture.detectChanges();
    expect(el.querySelector('p.oc-empty__title')).not.toBeNull();
    expect(el.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('renders a scene name as <oc-illustration>', () => {
    const { fixture, host, el } = setup();
    host.illustration.set('no-results');
    host.size.set('compact');
    fixture.detectChanges();
    const art = el.querySelector('.oc-empty__media oc-illustration');
    expect(art?.getAttribute('name')).toBe('no-results');
    expect(art?.hasAttribute('compact')).toBe(true);
  });
});
