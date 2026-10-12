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
  numberAttribute,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NwSkeleton } from './display';

export type SortDirection = 'asc' | 'desc';
export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface DataColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  /** Value used for sorting. Defaults to `row[key]`. */
  sortValue?: (row: T) => string | number | null | undefined;
}

export interface NwCellContext<T> {
  $implicit: T;
  row: T;
  index: number;
}

/**
 * Custom cell content for a column:
 * `<ng-template nwCell="status" let-row>{{ row.status }}</ng-template>`.
 */
@Directive({ selector: 'ng-template[nwCell]' })
export class NwCell<T = any> {
  readonly key = input.required<string>({ alias: 'nwCell' });
  readonly template = inject<TemplateRef<NwCellContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: NwCell<T>, ctx: unknown): ctx is NwCellContext<T> {
    return true;
  }
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

@Component({
  selector: 'nw-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NwSkeleton],
  host: { class: 'nw-table-wrap' },
  template: `
    <table class="nw-table" [attr.aria-busy]="loading() ? 'true' : null">
      @if (caption()) {
        <caption [class.nw-sr-only]="!captionVisible()">{{ caption() }}</caption>
      }
      <thead>
        <tr>
          @for (col of columns(); track col.key) {
            <th [class]="alignClass(col.align)" [attr.aria-sort]="ariaSort(col)">
              @if (col.sortable) {
                <button type="button" class="nw-table__sort" (click)="toggleSort(col.key)">
                  {{ col.label }}
                  <span aria-hidden="true">{{ sortIcon(col.key) }}</span>
                </button>
              } @else {
                {{ col.label }}
              }
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @if (loading()) {
          @for (r of skeletonRows(); track r) {
            <tr>
              @for (col of columns(); track col.key) {
                <td><nw-skeleton [height]="14" /></td>
              }
            </tr>
          }
        } @else {
          @for (row of sortedRows(); track keyOf(row, $index); let i = $index) {
            <tr>
              @for (col of columns(); track col.key) {
                <td [class]="alignClass(col.align)">
                  @if (cellTemplates().get(col.key); as tpl) {
                    <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: row, row: row, index: i }" />
                  } @else {
                    {{ row[col.key] }}
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td class="nw-table__empty" [attr.colspan]="columns().length">{{ emptyMessage() }}</td>
            </tr>
          }
        }
      </tbody>
    </table>
  `,
})
export class NwDataTable<T extends Record<string, any> = Record<string, any>> {
  readonly columns = input<DataColumn<T>[]>([]);
  readonly rows = input<T[]>([]);
  /** Field name or function that returns a unique row key. Defaults to `id`. */
  readonly rowKey = input<string | ((row: T) => string | number)>('id');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingRows = input(3, { transform: numberAttribute });
  readonly emptyMessage = input('No data');
  /** When true, rows are assumed sorted by the server and are not re-sorted here. */
  readonly remote = input(false, { transform: booleanAttribute });
  readonly defaultSort = input<SortState | undefined>(undefined);
  /** Accessible name of the table. Hidden visually unless `captionVisible`. */
  readonly caption = input<string>();
  readonly captionVisible = input(false, { transform: booleanAttribute });
  readonly sortChange = output<SortState>();

  protected readonly cells = contentChildren(NwCell);
  /** Current sort (starts at `defaultSort`). */
  readonly sort = linkedSignal<SortState | undefined>(() => this.defaultSort());

  protected readonly cellTemplates = computed(() => {
    const map = new Map<string, TemplateRef<NwCellContext<T>>>();
    for (const c of this.cells()) map.set(c.key(), c.template as TemplateRef<NwCellContext<T>>);
    return map;
  });

  protected readonly skeletonRows = computed(() => Array.from({ length: this.loadingRows() }, (_, i) => i));

  readonly sortedRows = computed(() => {
    const rows = this.rows();
    const sort = this.sort();
    if (this.remote() || !sort) return rows;
    const col = this.columns().find((c) => c.key === sort.key);
    if (!col) return rows;
    const value = (row: T) => (col.sortValue ? col.sortValue(row) : row[col.key]);
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => dir * compareValues(value(a), value(b)));
  });

  toggleSort(key: string): void {
    const current = this.sort();
    const direction: SortDirection = current?.key === key && current.direction === 'asc' ? 'desc' : 'asc';
    const next = { key, direction };
    this.sort.set(next);
    this.sortChange.emit(next);
  }

  protected keyOf(row: T, index: number): unknown {
    const rowKey = this.rowKey();
    if (typeof rowKey === 'function') return rowKey(row);
    const v = row[rowKey];
    return typeof v === 'string' || typeof v === 'number' ? v : index;
  }

  protected ariaSort(col: DataColumn<T>): string | null {
    const sort = this.sort();
    if (!col.sortable || sort?.key !== col.key) return null;
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(key: string): string {
    const sort = this.sort();
    if (sort?.key !== key) return '↕';
    return sort.direction === 'asc' ? '▲' : '▼';
  }

  protected alignClass(align: DataColumn['align']): string {
    return align === 'end' ? 'nw-table__align-end' : align === 'center' ? 'nw-table__align-center' : '';
  }
}
