import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlPagination, PlTabPanel, PlTabs } from './navigation';
import { PlCell, PlDataTable, type DataColumn, type SortState } from './data-table';

describe('PlTabs', () => {
  @Component({
    imports: [PlTabs, PlTabPanel],
    template: `
      <pl-tabs label="Settings" [tabs]="tabs" [(value)]="active">
        <ng-template plTabPanel="profile"><p class="content">Profile panel</p></ng-template>
        <ng-template plTabPanel="billing"><p class="content">Billing panel</p></ng-template>
        <ng-template plTabPanel="team"><p class="content">Team panel</p></ng-template>
      </pl-tabs>
    `,
  })
  class Host {
    tabs = [
      { key: 'profile', label: 'Profile' },
      { key: 'billing', label: 'Billing', disabled: true },
      { key: 'team', label: 'Team' },
      { key: 'security', label: 'Security' },
    ];
    active = signal<string | undefined>(undefined);
  }

  const key = (target: Element, k: string) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

  it('renders ARIA tabs wired to the panel', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const tabs = Array.from(el.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
    expect(el.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Settings');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
    const panel = el.querySelector('[role="tabpanel"]')!;
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);
    expect(tabs[0].getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.textContent).toContain('Profile panel');
  });

  it('supports ArrowRight (skipping disabled), ArrowLeft wrap, Home and End', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const tabs = Array.from(el.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];

    key(tabs[0], 'ArrowRight');
    await fixture.whenStable();
    expect(fixture.componentInstance.active()).toBe('team');
    expect(document.activeElement).toBe(tabs[2]);
    expect(el.querySelector('[role="tabpanel"]')?.textContent).toContain('Team panel');
    expect(tabs[2].tabIndex).toBe(0);
    expect(tabs[0].tabIndex).toBe(-1);

    key(tabs[2], 'End');
    await fixture.whenStable();
    expect(fixture.componentInstance.active()).toBe('security');

    key(tabs[3], 'ArrowRight');
    await fixture.whenStable();
    expect(fixture.componentInstance.active()).toBe('profile');

    key(tabs[0], 'ArrowLeft');
    await fixture.whenStable();
    expect(fixture.componentInstance.active()).toBe('security');

    key(tabs[3], 'Home');
    await fixture.whenStable();
    expect(fixture.componentInstance.active()).toBe('profile');
    expect(document.activeElement).toBe(tabs[0]);
  });
});

describe('PlPagination', () => {
  @Component({
    imports: [PlPagination],
    template: `<pl-pagination [(page)]="page" [pageCount]="10" (pageChange)="changes.push($event)" />`,
  })
  class Host {
    page = signal(5);
    changes: number[] = [];
  }

  it('emits pageChange for page, previous and next buttons', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
    expect(el.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('5');
    expect(el.querySelectorAll('.pl-pagination__ellipsis').length).toBe(2);

    (el.querySelector('[aria-label="Next page"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.page()).toBe(6);

    (el.querySelector('[aria-label="Page 10"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect((el.querySelector('[aria-label="Next page"]') as HTMLButtonElement).disabled).toBe(true);

    (el.querySelector('[aria-label="Previous page"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.changes).toEqual([6, 10, 9]);
  });
});

interface Person extends Record<string, unknown> {
  id: number;
  name: string;
  age: number;
}

describe('PlDataTable', () => {
  @Component({
    imports: [PlDataTable, PlCell],
    template: `
      <pl-data-table
        caption="People"
        [columns]="columns"
        [rows]="rows"
        [loading]="loading()"
        (sortChange)="sorts.push($event)"
      >
        <ng-template plCell="name" let-row><strong class="custom">{{ row.name }}!</strong></ng-template>
      </pl-data-table>
    `,
  })
  class Host {
    columns: DataColumn<Person>[] = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'age', label: 'Age', sortable: true, align: 'end' },
    ];
    rows: Person[] = [
      { id: 1, name: 'Zed', age: 30 },
      { id: 2, name: 'amy', age: 25 },
      { id: 3, name: 'Bob', age: 41 },
    ];
    loading = signal(false);
    sorts: SortState[] = [];
  }

  const names = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('tbody tr td:first-child')).map((td) => td.textContent?.trim());

  it('sorts ascending then descending and sets aria-sort', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('caption')?.className).toBe('pl-sr-only');
    expect(names(el)).toEqual(['Zed!', 'amy!', 'Bob!']);
    expect(el.querySelector('.custom')).not.toBeNull();

    const [nameSort, ageSort] = Array.from(el.querySelectorAll('.pl-table__sort')) as HTMLButtonElement[];
    nameSort.click();
    await fixture.whenStable();
    expect(names(el)).toEqual(['amy!', 'Bob!', 'Zed!']);
    expect(el.querySelectorAll('th')[0].getAttribute('aria-sort')).toBe('ascending');

    nameSort.click();
    await fixture.whenStable();
    expect(names(el)).toEqual(['Zed!', 'Bob!', 'amy!']);
    expect(el.querySelectorAll('th')[0].getAttribute('aria-sort')).toBe('descending');

    ageSort.click();
    await fixture.whenStable();
    expect(names(el)).toEqual(['amy!', 'Zed!', 'Bob!']);
    expect(el.querySelectorAll('th')[0].hasAttribute('aria-sort')).toBe(false);
    expect(el.querySelectorAll('td')[1].className).toBe('pl-table__align-end');
    expect(fixture.componentInstance.sorts).toEqual([
      { key: 'name', direction: 'asc' },
      { key: 'name', direction: 'desc' },
      { key: 'age', direction: 'asc' },
    ]);
  });

  it('renders skeleton rows and aria-busy while loading', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('tbody tr').length).toBe(3);
    expect(el.querySelectorAll('tbody .pl-skeleton').length).toBe(6);
  });
});
