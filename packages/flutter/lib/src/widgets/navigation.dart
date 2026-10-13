import 'package:flutter/material.dart';

import '../foundation/group_focus.dart';
import '../foundation/pressable.dart';
import '../foundation/utils.dart';
import '../theme/colors.dart';
import '../theme/pelagic_theme.dart';

bool _reduceMotion(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

/// A tab of [PelagicTabs].
@immutable
class PelagicTabItem {
  /// Creates a tab.
  const PelagicTabItem({required this.id, required this.label, this.disabled = false, this.content});

  /// Unique id.
  final String id;

  /// Visible label.
  final String label;

  /// Not selectable.
  final bool disabled;

  /// Panel shown when the tab is selected.
  final Widget? content;
}

/// Tabs with a panel.
///
/// Keyboard: Left / Right move to the previous / next tab (mirrored in RTL)
/// and select it, Home / End jump to the first / last tab. Only the selected
/// tab is in the Tab order (roving focus), like the web tabs.
class PelagicTabs extends StatefulWidget {
  /// Creates tabs. Pass [value] to control the selection, or [initialValue].
  const PelagicTabs({super.key, required this.tabs, this.value, this.initialValue, this.onChanged, this.label});

  /// Tabs.
  final List<PelagicTabItem> tabs;

  /// Selected id (controlled).
  final String? value;

  /// Initially selected id (uncontrolled).
  final String? initialValue;

  /// Selection callback.
  final ValueChanged<String>? onChanged;

  /// Accessible name of the tab list.
  final String? label;

  @override
  State<PelagicTabs> createState() => _PelagicTabsState();
}

class _PelagicTabsState extends State<PelagicTabs> {
  final PelagicGroupFocus _focus = PelagicGroupFocus('PelagicTab');
  String? _inner;

  @override
  void initState() {
    super.initState();
    _inner = widget.initialValue ?? (widget.tabs.isEmpty ? null : widget.tabs.first.id);
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  String? get _active => widget.value ?? _inner;

  bool _enabled(int i) => !widget.tabs[i].disabled;

  void _select(int i) {
    if (i < 0 || i >= widget.tabs.length || !_enabled(i)) return;
    final String id = widget.tabs[i].id;
    if (widget.value == null) setState(() => _inner = id);
    widget.onChanged?.call(id);
    _focus[i].requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final PelagicTheme t = PelagicTheme.of(context);
    final PelagicColors c = t.colors;
    final int length = widget.tabs.length;
    final int activeIndex = widget.tabs.indexWhere((PelagicTabItem tab) => tab.id == _active);
    final int tabStop = activeIndex >= 0 ? activeIndex : pelagicEdgeEnabled(false, length, _enabled);
    final Widget? panel = activeIndex >= 0 ? widget.tabs[activeIndex].content : null;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        DecoratedBox(
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.border))),
          child: Semantics(
            container: true,
            explicitChildNodes: true,
            label: widget.label,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: PelagicArrowKeys(
                onMove: (int delta) {
                  final int from = _focus.focusedIndex >= 0 ? _focus.focusedIndex : tabStop;
                  _select(pelagicNextEnabled(from, delta, length, _enabled));
                },
                onEdge: (bool last) => _select(pelagicEdgeEnabled(last, length, _enabled)),
                child: Row(
                  children: <Widget>[
                    for (int i = 0; i < length; i++)
                      PelagicPressable(
                        focusNode: _focus[i]..skipTraversal = i != tabStop,
                        requestFocusOnTap: true,
                        selected: i == activeIndex,
                        semanticHint: 'Tab ${i + 1} of $length',
                        onPressed: _enabled(i) ? () => _select(i) : null,
                        borderRadius: BorderRadius.circular(t.radii.sm),
                        child: Container(
                          padding: const EdgeInsetsDirectional.symmetric(horizontal: PelagicSpace.md, vertical: PelagicSpace.md),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: i == activeIndex ? c.primary : const Color(0x00000000),
                                width: t.isHighContrast ? 3 : 2,
                              ),
                            ),
                          ),
                          child: Text(
                            widget.tabs[i].label,
                            style: TextStyle(
                              color: i == activeIndex
                                  ? c.primaryInk
                                  : (_enabled(i) ? c.textMuted : c.border),
                              fontWeight: FontWeight.w600,
                              fontSize: PelagicFontSize.md,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (panel != null)
          Semantics(
            container: true,
            explicitChildNodes: true,
            label: activeIndex >= 0 ? widget.tabs[activeIndex].label : null,
            child: Padding(
              padding: const EdgeInsetsDirectional.symmetric(vertical: PelagicSpace.md),
              child: KeyedSubtree(key: ValueKey<String>(widget.tabs[activeIndex].id), child: panel),
            ),
          ),
      ],
    );
  }
}

/// A section of [PelagicAccordion].
@immutable
class PelagicAccordionItem {
  /// Creates a section.
  const PelagicAccordionItem({required this.id, required this.title, required this.content});

  /// Unique id.
  final String id;

  /// Header text.
  final String title;

  /// Body.
  final Widget content;
}

/// Expandable sections.
class PelagicAccordion extends StatefulWidget {
  /// Creates an accordion.
  const PelagicAccordion({super.key, required this.items, this.multiple = false, this.initiallyOpen = const <String>{}});

  /// Sections.
  final List<PelagicAccordionItem> items;

  /// Allow several open sections.
  final bool multiple;

  /// Ids open at first build.
  final Set<String> initiallyOpen;

  @override
  State<PelagicAccordion> createState() => _PelagicAccordionState();
}

class _PelagicAccordionState extends State<PelagicAccordion> {
  late Set<String> _open = <String>{...widget.initiallyOpen};

  void _toggle(String id) {
    setState(() {
      if (_open.contains(id)) {
        _open = <String>{..._open}..remove(id);
      } else {
        _open = widget.multiple ? <String>{..._open, id} : <String>{id};
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final PelagicTheme t = PelagicTheme.of(context);
    final PelagicColors c = t.colors;
    final Duration duration = _reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 180);
    return Container(
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
          for (int i = 0; i < widget.items.length; i++) ...<Widget>[
            if (i > 0) Container(height: 1, color: c.border),
            Builder(builder: (BuildContext context) {
              final PelagicAccordionItem item = widget.items[i];
              final bool expanded = _open.contains(item.id);
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  PelagicPressable(
                    onPressed: () => _toggle(item.id),
                    semanticValue: expanded ? 'Expanded' : 'Collapsed',
                    semanticHint: expanded ? 'Activate to collapse' : 'Activate to expand',
                    child: Padding(
                      padding: const EdgeInsetsDirectional.all(PelagicSpace.lg),
                      child: Row(
                        children: <Widget>[
                          Expanded(
                            child: Semantics(
                              header: true,
                              child: Text(
                                item.title,
                                style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: PelagicFontSize.md),
                              ),
                            ),
                          ),
                          ExcludeSemantics(
                            child: AnimatedRotation(
                              turns: expanded ? 0.5 : 0,
                              duration: duration,
                              child: Icon(Icons.expand_more, color: c.textMuted),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  AnimatedSize(
                    duration: duration,
                    alignment: AlignmentDirectional.topStart,
                    child: expanded
                        ? Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                              PelagicSpace.lg,
                              0,
                              PelagicSpace.lg,
                              PelagicSpace.lg,
                            ),
                            child: item.content,
                          )
                        : const SizedBox(width: double.infinity),
                  ),
                ],
              );
            }),
          ],
        ],
      ),
    );
  }
}

/// A crumb of [PelagicBreadcrumb].
@immutable
class PelagicBreadcrumbItem {
  /// Creates a crumb.
  const PelagicBreadcrumbItem({required this.label, this.onPressed});

  /// Text.
  final String label;

  /// Navigation callback. The last crumb is the current page and is not a link.
  final VoidCallback? onPressed;
}

/// Trail of links to parent pages. The last item is the current page.
class PelagicBreadcrumb extends StatelessWidget {
  /// Creates a breadcrumb.
  const PelagicBreadcrumb({super.key, required this.items, this.label = 'Breadcrumb'});

  /// Crumbs, root first.
  final List<PelagicBreadcrumbItem> items;

  /// Accessible name of the trail.
  final String label;

  @override
  Widget build(BuildContext context) {
    final PelagicTheme t = PelagicTheme.of(context);
    final PelagicColors c = t.colors;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        children: <Widget>[
          for (int i = 0; i < items.length; i++) ...<Widget>[
            if (i > 0)
              ExcludeSemantics(
                child: Padding(
                  padding: const EdgeInsetsDirectional.symmetric(horizontal: PelagicSpace.xs),
                  child: Text('/', style: TextStyle(color: c.controlBorder, fontSize: PelagicFontSize.sm)),
                ),
              ),
            if (i == items.length - 1 || items[i].onPressed == null)
              Semantics(
                hint: i == items.length - 1 ? 'Current page' : null,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: pelagicMinTapTarget),
                  child: Align(
                    widthFactor: 1,
                    heightFactor: 1,
                    child: Text(
                      items[i].label,
                      style: TextStyle(
                        color: c.text,
                        fontWeight: i == items.length - 1 ? FontWeight.w700 : FontWeight.w500,
                        fontSize: PelagicFontSize.sm,
                      ),
                    ),
                  ),
                ),
              )
            else
              PelagicPressable(
                link: true,
                onPressed: items[i].onPressed,
                borderRadius: BorderRadius.circular(t.radii.sm),
                minSize: const Size(pelagicMinTapTarget, pelagicMinTapTarget),
                child: Padding(
                  padding: const EdgeInsetsDirectional.symmetric(horizontal: PelagicSpace.xs),
                  child: Center(
                    widthFactor: 1,
                    heightFactor: 1,
                    child: Text(
                      items[i].label,
                      style: TextStyle(
                        color: c.primaryInk,
                        fontWeight: FontWeight.w500,
                        fontSize: PelagicFontSize.sm,
                        decoration: TextDecoration.underline,
                        decorationColor: c.primaryInk,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

/// Page navigation (1-based).
///
/// Keyboard: Left / Right go to the previous / next page (mirrored in RTL),
/// Home / End to the first / last page.
class PelagicPagination extends StatelessWidget {
  /// Creates pagination.
  const PelagicPagination({
    super.key,
    required this.page,
    required this.pageCount,
    required this.onChanged,
    this.label = 'Pagination',
    this.previousLabel = 'Previous page',
    this.nextLabel = 'Next page',
    this.pageLabel = _defaultPageLabel,
  });

  static String _defaultPageLabel(int page) => 'Page $page';

  /// Current page (1-based).
  final int page;

  /// Number of pages.
  final int pageCount;

  /// Called with the requested page.
  final ValueChanged<int> onChanged;

  /// Accessible name of the navigation.
  final String label;

  /// Accessible name of the previous button.
  final String previousLabel;

  /// Accessible name of the next button.
  final String nextLabel;

  /// Accessible name of a page button.
  final String Function(int page) pageLabel;

  void _go(int target) {
    final int clamped = target.clamp(1, pageCount < 1 ? 1 : pageCount);
    if (clamped != page) onChanged(clamped);
  }

  @override
  Widget build(BuildContext context) {
    final PelagicTheme t = PelagicTheme.of(context);
    final PelagicColors c = t.colors;
    Widget pageButton({
      required Widget child,
      required String semanticLabel,
      required int target,
      required bool enabled,
      bool selected = false,
    }) {
      return PelagicPressable(
        onPressed: enabled ? () => _go(target) : null,
        selected: selected,
        semanticLabel: semanticLabel,
        semanticHint: selected ? 'Current page' : null,
        excludeChildSemantics: true,
        borderRadius: BorderRadius.circular(t.radii.md),
        child: Container(
          constraints: const BoxConstraints(minWidth: pelagicMinTapTarget, minHeight: pelagicMinTapTarget),
          alignment: Alignment.center,
          padding: const EdgeInsetsDirectional.symmetric(horizontal: PelagicSpace.sm),
          decoration: BoxDecoration(
            color: selected ? c.primary : null,
            borderRadius: BorderRadius.circular(t.radii.md),
          ),
          child: DefaultTextStyle.merge(
            style: TextStyle(
              color: selected ? c.onPrimary : (enabled ? c.text : c.border),
              fontWeight: FontWeight.w600,
              fontSize: PelagicFontSize.md,
            ),
            child: IconTheme.merge(
              data: IconThemeData(color: enabled ? c.text : c.border),
              child: child,
            ),
          ),
        ),
      );
    }

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      value: 'Page $page of $pageCount',
      child: PelagicArrowKeys(
        onMove: (int delta) => _go(page + delta),
        onEdge: (bool last) => _go(last ? pageCount : 1),
        child: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: PelagicSpace.xs,
          children: <Widget>[
            pageButton(
              // chevron_left / chevron_right mirror automatically in RTL (matchTextDirection).
              child: const Icon(Icons.chevron_left),
              semanticLabel: previousLabel,
              target: page - 1,
              enabled: page > 1,
            ),
            for (final int? item in pelagicPageItems(page, pageCount))
              if (item == null)
                ExcludeSemantics(
                  child: SizedBox(
                    width: 24,
                    height: pelagicMinTapTarget,
                    child: Center(child: Text('…', style: TextStyle(color: c.textMuted))),
                  ),
                )
              else
                pageButton(
                  child: Text('$item'),
                  semanticLabel: pageLabel(item),
                  target: item,
                  enabled: true,
                  selected: item == page,
                ),
            pageButton(
              child: const Icon(Icons.chevron_right),
              semanticLabel: nextLabel,
              target: page + 1,
              enabled: page < pageCount,
            ),
          ],
        ),
      ),
    );
  }
}
