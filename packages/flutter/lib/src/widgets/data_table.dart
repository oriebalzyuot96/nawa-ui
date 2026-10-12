import 'package:flutter/material.dart';

import '../foundation/pressable.dart';
import '../foundation/utils.dart';
import '../theme/colors.dart';
import '../theme/nawa_theme.dart';
import 'display.dart';

/// Sort direction.
enum NawaSortDirection {
  /// A to Z, small to large.
  ascending,

  /// Z to A, large to small.
  descending,
}

/// Current sort of a [NawaDataTable].
@immutable
class NawaSort {
  /// Creates a sort.
  const NawaSort(this.columnKey, this.direction);

  /// Column key.
  final String columnKey;

  /// Direction.
  final NawaSortDirection direction;

  @override
  bool operator ==(Object other) =>
      other is NawaSort && other.columnKey == columnKey && other.direction == direction;

  @override
  int get hashCode => Object.hash(columnKey, direction);

  @override
  String toString() => 'NawaSort($columnKey, ${direction.name})';
}

/// Horizontal alignment of a column.
enum NawaColumnAlign {
  /// Start (left in LTR, right in RTL).
  start,

  /// Center.
  center,

  /// End (numbers).
  end,
}

/// A column of [NawaDataTable].
@immutable
class NawaDataColumn<T> {
  /// Creates a column.
  const NawaDataColumn({
    required this.key,
    required this.label,
    required this.value,
    this.sortable = false,
    this.align = NawaColumnAlign.start,
    this.width,
    this.cellBuilder,
  });

  /// Unique key.
  final String key;

  /// Header text.
  final String label;

  /// Cell value, used for the default cell text and for sorting.
  final Object? Function(T row) value;

  /// Header is a sort button.
  final bool sortable;

  /// Alignment.
  final NawaColumnAlign align;

  /// Fixed width. Columns without one share the free space.
  final double? width;

  /// Custom cell.
  final Widget Function(BuildContext context, T row)? cellBuilder;
}

/// Sortable data table with a loading skeleton and an empty state.
///
/// Sort changes are announced to screen readers. Wide tables scroll
/// horizontally.
class NawaDataTable<T> extends StatefulWidget {
  /// Creates a data table.
  const NawaDataTable({
    super.key,
    required this.columns,
    required this.rows,
    this.loading = false,
    this.loadingRows = 3,
    this.loadingLabel = 'Loading rows',
    this.emptyTitle = 'No data',
    this.emptyDescription,
    this.remote = false,
    this.initialSort,
    this.onSortChanged,
    this.caption,
    this.onRowTap,
  });

  /// Columns.
  final List<NawaDataColumn<T>> columns;

  /// Rows.
  final List<T> rows;

  /// Show skeleton rows.
  final bool loading;

  /// Number of skeleton rows.
  final int loadingRows;

  /// Accessible label while loading.
  final String loadingLabel;

  /// Empty state title.
  final String emptyTitle;

  /// Empty state description.
  final String? emptyDescription;

  /// Rows are sorted by the server: only report sort changes.
  final bool remote;

  /// Initial sort.
  final NawaSort? initialSort;

  /// Sort change callback.
  final ValueChanged<NawaSort>? onSortChanged;

  /// Accessible caption of the table.
  final String? caption;

  /// Row activation callback.
  final ValueChanged<T>? onRowTap;

  @override
  State<NawaDataTable<T>> createState() => _NawaDataTableState<T>();
}

class _NawaDataTableState<T> extends State<NawaDataTable<T>> {
  late NawaSort? _sort = widget.initialSort;

  List<T> get _sortedRows {
    final NawaSort? sort = _sort;
    if (widget.remote || sort == null) return widget.rows;
    NawaDataColumn<T>? column;
    for (final NawaDataColumn<T> c in widget.columns) {
      if (c.key == sort.columnKey) column = c;
    }
    if (column == null) return widget.rows;
    final NawaDataColumn<T> col = column;
    final int dir = sort.direction == NawaSortDirection.ascending ? 1 : -1;
    final List<T> sorted = List<T>.of(widget.rows);
    // Stable sort: List.sort is not guaranteed stable, so break ties by index.
    final Map<T, int> index = <T, int>{};
    for (int i = 0; i < widget.rows.length; i++) {
      index.putIfAbsent(widget.rows[i], () => i);
    }
    sorted.sort((T a, T b) {
      final int r = nawaCompareValues(col.value(a), col.value(b));
      return r != 0 ? dir * r : (index[a] ?? 0).compareTo(index[b] ?? 0);
    });
    return sorted;
  }

  void _toggleSort(NawaDataColumn<T> column) {
    final NawaSortDirection direction =
        _sort?.columnKey == column.key && _sort?.direction == NawaSortDirection.ascending
            ? NawaSortDirection.descending
            : NawaSortDirection.ascending;
    final NawaSort next = NawaSort(column.key, direction);
    setState(() => _sort = next);
    widget.onSortChanged?.call(next);
    nawaAnnounce(
      context,
      'Sorted by ${column.label}, ${direction == NawaSortDirection.ascending ? 'ascending' : 'descending'}',
    );
  }

  AlignmentGeometry _alignment(NawaColumnAlign align) => switch (align) {
        NawaColumnAlign.start => AlignmentDirectional.centerStart,
        NawaColumnAlign.center => Alignment.center,
        NawaColumnAlign.end => AlignmentDirectional.centerEnd,
      };

  Widget _cell(Widget child, NawaColumnAlign align) {
    return Container(
      constraints: const BoxConstraints(minHeight: nawaMinTapTarget),
      alignment: _alignment(align),
      padding: const EdgeInsetsDirectional.symmetric(horizontal: NawaSpace.md, vertical: NawaSpace.sm),
      child: child,
    );
  }

  Widget _header(NawaDataColumn<T> column, NawaTheme t) {
    final NawaColors c = t.colors;
    final TextStyle style = TextStyle(color: c.textMuted, fontWeight: FontWeight.w600, fontSize: NawaFontSize.sm);
    if (!column.sortable) {
      return Semantics(header: true, child: _cell(Text(column.label, style: style), column.align));
    }
    final bool active = _sort?.columnKey == column.key;
    final bool ascending = _sort?.direction == NawaSortDirection.ascending;
    final IconData icon = !active ? Icons.unfold_more : (ascending ? Icons.arrow_upward : Icons.arrow_downward);
    return Semantics(
      header: true,
      child: NawaPressable(
        onPressed: () => _toggleSort(column),
        semanticLabel: column.label,
        semanticValue: active ? (ascending ? 'Sorted ascending' : 'Sorted descending') : 'Not sorted',
        semanticHint: active && ascending ? 'Activate to sort descending' : 'Activate to sort ascending',
        excludeChildSemantics: true,
        minSize: const Size(0, nawaMinTapTarget),
        child: _cell(
          Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Flexible(child: Text(column.label, style: style.copyWith(color: active ? c.text : c.textMuted))),
              const SizedBox(width: NawaSpace.xs),
              Icon(icon, size: 16, color: active ? c.primaryInk : c.textMuted),
            ],
          ),
          column.align,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final NawaColors c = t.colors;
    final List<NawaDataColumn<T>> columns = widget.columns;
    final List<T> rows = _sortedRows;

    final Map<int, TableColumnWidth> widths = <int, TableColumnWidth>{
      for (int i = 0; i < columns.length; i++)
        i: columns[i].width != null
            ? FixedColumnWidth(columns[i].width!)
            : const IntrinsicColumnWidth(flex: 1),
    };

    final List<TableRow> tableRows = <TableRow>[
      TableRow(
        decoration: BoxDecoration(
          color: c.surfaceAlt,
          border: Border(bottom: BorderSide(color: t.isHighContrast ? c.controlBorder : c.border)),
        ),
        children: <Widget>[for (final NawaDataColumn<T> col in columns) _header(col, t)],
      ),
      if (widget.loading)
        for (int r = 0; r < widget.loadingRows; r++)
          TableRow(
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.border))),
            children: <Widget>[
              for (final NawaDataColumn<T> col in columns)
                _cell(const SizedBox(width: 72, child: NawaSkeleton(height: 12)), col.align),
            ],
          )
      else
        for (final T row in rows)
          TableRow(
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.border))),
            children: <Widget>[
              for (final NawaDataColumn<T> col in columns)
                _wrapRowTap(
                  row,
                  _cell(
                    col.cellBuilder?.call(context, row) ??
                        Text(
                          '${col.value(row) ?? ''}',
                          style: TextStyle(color: c.text, fontSize: NawaFontSize.sm),
                        ),
                    col.align,
                  ),
                ),
            ],
          ),
    ];

    final Widget table = LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: constraints.hasBoundedWidth ? constraints.maxWidth : 0),
            child: Table(
              columnWidths: widths,
              defaultVerticalAlignment: TableCellVerticalAlignment.middle,
              children: tableRows,
            ),
          ),
        );
      },
    );

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.caption,
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(t.radii.lg),
          border: Border.all(color: t.isHighContrast ? c.controlBorder : c.border, width: t.borderWidth),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            if (widget.loading)
              Semantics(container: true, liveRegion: true, label: widget.loadingLabel, child: table)
            else
              table,
            if (!widget.loading && rows.isEmpty)
              NawaEmptyState(title: widget.emptyTitle, description: widget.emptyDescription),
          ],
        ),
      ),
    );
  }

  Widget _wrapRowTap(T row, Widget cell) {
    final ValueChanged<T>? onTap = widget.onRowTap;
    if (onTap == null) return cell;
    return NawaPressable(
      button: false,
      onPressed: () => onTap(row),
      minSize: const Size(0, nawaMinTapTarget),
      child: cell,
    );
  }
}
