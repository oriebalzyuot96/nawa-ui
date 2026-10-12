// containsSemantics is deprecated after Flutter 3.40 (isSemantics); kept so the tests also run on the 3.24 minimum.
// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orca_ui/orca_ui.dart';

final ThemeData _theme = OrcaThemeData.build();

Widget _wrap(Widget child, {TextDirection direction = TextDirection.ltr}) {
  return MaterialApp(
    theme: _theme,
    home: Directionality(
      textDirection: direction,
      child: Scaffold(
        body: Center(
          child: Padding(padding: const EdgeInsets.all(16), child: child),
        ),
      ),
    ),
  );
}

typedef _Person = ({String name, int age});

void main() {
  testWidgets('OrcaButton exposes the loading state to semantics', (WidgetTester tester) async {
    final handle = tester.ensureSemantics();
    int taps = 0;

    await tester.pumpWidget(_wrap(OrcaButton(label: 'Save', loading: true, onPressed: () => taps++)));
    expect(
      tester.getSemantics(find.byType(OrcaButton)),
      containsSemantics(label: 'Save', value: 'Loading', isButton: true, hasEnabledState: true, isEnabled: false),
    );
    await tester.tap(find.byType(OrcaButton), warnIfMissed: false);
    await tester.pump();
    expect(taps, 0);

    await tester.pumpWidget(_wrap(OrcaButton(label: 'Save', onPressed: () => taps++)));
    expect(
      tester.getSemantics(find.byType(OrcaButton)),
      containsSemantics(label: 'Save', isButton: true, hasEnabledState: true, isEnabled: true),
    );
    await tester.tap(find.byType(OrcaButton));
    await tester.pump();
    expect(taps, 1);

    // Hit area is at least 48x48 even for the small size.
    await tester.pumpWidget(_wrap(OrcaButton(label: 'S', size: OrcaButtonSize.sm, onPressed: () {})));
    final Size size = tester.getSize(find.byType(OrcaButton));
    expect(size.width, greaterThanOrEqualTo(48));
    expect(size.height, greaterThanOrEqualTo(48));
    handle.dispose();
  });

  testWidgets('OrcaInput exposes label and error to semantics', (WidgetTester tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(
      _wrap(const OrcaInput(label: 'Email', hint: 'We never share it', error: 'Enter a valid email')),
    );
    final data = tester.getSemantics(find.bySemanticsLabel(RegExp('Email')).first).getSemanticsData();
    expect(data.label, contains('Email'));
    expect(data.hint, contains('Enter a valid email'));
    // The visible error text is rendered (and is a live region).
    expect(find.text('Enter a valid email'), findsOneWidget);
    // Without an error, the hint describes the field.
    await tester.pumpWidget(_wrap(const OrcaInput(label: 'Email', hint: 'We never share it')));
    final plain = tester.getSemantics(find.bySemanticsLabel(RegExp('Email')).first).getSemanticsData();
    expect(plain.hint, contains('We never share it'));
    expect(find.text('Enter a valid email'), findsNothing);
    handle.dispose();
  });

  testWidgets('OrcaSwitch toggles and reports its state', (WidgetTester tester) async {
    final handle = tester.ensureSemantics();
    bool value = false;
    await tester.pumpWidget(
      _wrap(
        StatefulBuilder(
          builder: (BuildContext context, StateSetter setState) => OrcaSwitch(
            label: 'Wi-Fi',
            value: value,
            onChanged: (bool v) => setState(() => value = v),
          ),
        ),
      ),
    );
    expect(
      tester.getSemantics(find.byType(OrcaSwitch)),
      containsSemantics(label: 'Wi-Fi', hasToggledState: true, isToggled: false),
    );
    await tester.tap(find.byType(OrcaSwitch));
    await tester.pumpAndSettle();
    expect(value, isTrue);
    expect(
      tester.getSemantics(find.byType(OrcaSwitch)),
      containsSemantics(label: 'Wi-Fi', hasToggledState: true, isToggled: true),
    );
    await tester.tap(find.text('Wi-Fi'));
    await tester.pumpAndSettle();
    expect(value, isFalse);
    handle.dispose();
  });

  group('OrcaTabs keyboard navigation', () {
    const List<OrcaTabItem> tabs = <OrcaTabItem>[
      OrcaTabItem(id: 'one', label: 'One', content: Text('Panel one')),
      OrcaTabItem(id: 'two', label: 'Two', content: Text('Panel two')),
      OrcaTabItem(id: 'skip', label: 'Skip', disabled: true, content: Text('Panel skip')),
      OrcaTabItem(id: 'three', label: 'Three', content: Text('Panel three')),
    ];

    testWidgets('arrows, Home and End move and select', (WidgetTester tester) async {
      final List<String> changes = <String>[];
      await tester.pumpWidget(_wrap(OrcaTabs(tabs: tabs, onChanged: changes.add)));
      expect(find.text('Panel one'), findsOneWidget);

      await tester.tap(find.text('One'));
      await tester.pump();

      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await tester.pump();
      expect(changes.last, 'two');
      expect(find.text('Panel two'), findsOneWidget);

      // The disabled tab is skipped.
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await tester.pump();
      expect(changes.last, 'three');
      expect(find.text('Panel three'), findsOneWidget);

      // Wraps around.
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await tester.pump();
      expect(changes.last, 'one');

      await tester.sendKeyEvent(LogicalKeyboardKey.end);
      await tester.pump();
      expect(changes.last, 'three');

      await tester.sendKeyEvent(LogicalKeyboardKey.home);
      await tester.pump();
      expect(changes.last, 'one');
      expect(find.text('Panel one'), findsOneWidget);
    });

    testWidgets('arrows are mirrored in RTL', (WidgetTester tester) async {
      final List<String> changes = <String>[];
      await tester.pumpWidget(_wrap(OrcaTabs(tabs: tabs, onChanged: changes.add), direction: TextDirection.rtl));
      await tester.tap(find.text('One'));
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
      await tester.pump();
      expect(changes.last, 'two');
    });
  });

  testWidgets('OrcaPagination calls back with the requested page', (WidgetTester tester) async {
    final handle = tester.ensureSemantics();
    final List<int> pages = <int>[];
    await tester.pumpWidget(_wrap(OrcaPagination(page: 1, pageCount: 10, onChanged: pages.add)));

    // Previous is disabled on the first page.
    expect(
      tester.getSemantics(find.bySemanticsLabel('Previous page')),
      containsSemantics(hasEnabledState: true, isEnabled: false),
    );
    await tester.tap(find.bySemanticsLabel('Previous page'), warnIfMissed: false);
    await tester.pump();
    expect(pages, isEmpty);

    await tester.tap(find.bySemanticsLabel('Next page'));
    await tester.pump();
    expect(pages, <int>[2]);

    await tester.tap(find.text('10'));
    await tester.pump();
    expect(pages, <int>[2, 10]);

    // The current page is selected and not re-requested.
    expect(tester.getSemantics(find.bySemanticsLabel('Page 1')), containsSemantics(isSelected: true));
    await tester.tap(find.text('1'));
    await tester.pump();
    expect(pages, <int>[2, 10]);

    // Keyboard: Tab into the group, then arrows / End.
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(pages.last, 2);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await tester.pump();
    expect(pages.last, 10);
    handle.dispose();
  });

  group('OrcaDataTable', () {
    const List<_Person> people = <_Person>[
      (name: 'Charlie', age: 30),
      (name: 'alice', age: 25),
      (name: 'Bob', age: 35),
    ];
    final List<OrcaDataColumn<_Person>> columns = <OrcaDataColumn<_Person>>[
      OrcaDataColumn<_Person>(key: 'name', label: 'Name', sortable: true, value: (_Person p) => p.name),
      OrcaDataColumn<_Person>(
        key: 'age',
        label: 'Age',
        sortable: true,
        align: OrcaColumnAlign.end,
        value: (_Person p) => p.age,
      ),
    ];

    testWidgets('sorts by column and reports the sort', (WidgetTester tester) async {
      final List<OrcaSort> sorts = <OrcaSort>[];
      await tester.pumpWidget(
        _wrap(OrcaDataTable<_Person>(columns: columns, rows: people, onSortChanged: sorts.add)),
      );
      double y(String text) => tester.getTopLeft(find.text(text)).dy;

      // Unsorted: source order.
      expect(y('Charlie'), lessThan(y('alice')));

      await tester.tap(find.text('Name'));
      await tester.pump();
      expect(sorts.last, const OrcaSort('name', OrcaSortDirection.ascending));
      expect(y('alice'), lessThan(y('Bob')));
      expect(y('Bob'), lessThan(y('Charlie')));

      await tester.tap(find.text('Name'));
      await tester.pump();
      expect(sorts.last, const OrcaSort('name', OrcaSortDirection.descending));
      expect(y('Charlie'), lessThan(y('Bob')));
      expect(y('Bob'), lessThan(y('alice')));

      await tester.tap(find.text('Age'));
      await tester.pump();
      expect(sorts.last, const OrcaSort('age', OrcaSortDirection.ascending));
      expect(y('25'), lessThan(y('30')));
      expect(y('30'), lessThan(y('35')));
    });

    testWidgets('remote tables only report the sort', (WidgetTester tester) async {
      final List<OrcaSort> sorts = <OrcaSort>[];
      await tester.pumpWidget(
        _wrap(OrcaDataTable<_Person>(columns: columns, rows: people, remote: true, onSortChanged: sorts.add)),
      );
      await tester.tap(find.text('Name'));
      await tester.pump();
      expect(sorts.single, const OrcaSort('name', OrcaSortDirection.ascending));
      expect(tester.getTopLeft(find.text('Charlie')).dy, lessThan(tester.getTopLeft(find.text('alice')).dy));
    });

    testWidgets('shows skeleton rows while loading and an empty state', (WidgetTester tester) async {
      await tester.pumpWidget(
        _wrap(OrcaDataTable<_Person>(columns: columns, rows: const <_Person>[], loading: true, loadingRows: 2)),
      );
      expect(find.byType(OrcaSkeleton), findsNWidgets(4));
      expect(find.text('No data'), findsNothing);

      await tester.pumpWidget(
        _wrap(OrcaDataTable<_Person>(columns: columns, rows: const <_Person>[], emptyTitle: 'No people')),
      );
      expect(find.byType(OrcaSkeleton), findsNothing);
      expect(find.text('No people'), findsOneWidget);
    });
  });

  testWidgets('showOrcaDialog dismisses with close, backdrop, Escape and actions', (WidgetTester tester) async {
    Future<bool?>? result;
    await tester.pumpWidget(
      MaterialApp(
        theme: _theme,
        home: Scaffold(
          body: Builder(
            builder: (BuildContext context) => Center(
              child: OrcaButton(
                label: 'Open',
                onPressed: () {
                  result = showOrcaDialog<bool>(
                    context: context,
                    title: 'Delete file?',
                    builder: (BuildContext context) => const Text('This cannot be undone.'),
                    actionsBuilder: (BuildContext dialogContext) => <Widget>[
                      OrcaButton(
                        label: 'Delete',
                        variant: OrcaButtonVariant.danger,
                        onPressed: () => Navigator.of(dialogContext).pop(true),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );

    Future<void> open() async {
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(find.text('This cannot be undone.'), findsOneWidget);
    }

    // Close button.
    await open();
    await tester.tap(find.byIcon(Icons.close));
    await tester.pumpAndSettle();
    expect(find.text('This cannot be undone.'), findsNothing);
    expect(await result, isNull);

    // Backdrop.
    await open();
    await tester.tapAt(const Offset(4, 4));
    await tester.pumpAndSettle();
    expect(find.text('This cannot be undone.'), findsNothing);

    // Escape.
    await open();
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    expect(find.text('This cannot be undone.'), findsNothing);

    // Action with a result.
    await open();
    await tester.tap(find.text('Delete'));
    await tester.pumpAndSettle();
    expect(find.text('This cannot be undone.'), findsNothing);
    expect(await result, isTrue);
  });

  group('OrcaSkeleton', () {
    testWidgets('shimmers by default', (WidgetTester tester) async {
      await tester.pumpWidget(_wrap(const OrcaSkeleton(width: 120)));
      expect(tester.hasRunningAnimations, isTrue);
    });

    testWidgets('does not animate when animations are disabled', (WidgetTester tester) async {
      await tester.pumpWidget(
        _wrap(
          Builder(
            builder: (BuildContext context) => MediaQuery(
              data: MediaQuery.of(context).copyWith(disableAnimations: true),
              child: const SizedBox(width: 300, child: OrcaSkeletonText()),
            ),
          ),
        ),
      );
      await tester.pump();
      expect(find.byType(OrcaSkeleton), findsNWidgets(3));
      expect(tester.hasRunningAnimations, isFalse);
    });

    testWidgets('skeleton text is announced once', (WidgetTester tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const SizedBox(width: 300, child: OrcaSkeletonText(label: 'Loading article'))));
      expect(find.bySemanticsLabel('Loading article'), findsOneWidget);
      handle.dispose();
    });
  });

  testWidgets('OrcaToast auto-dismisses and announces', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: _theme,
        home: Scaffold(
          body: Builder(
            builder: (BuildContext context) => Center(
              child: OrcaButton(
                label: 'Notify',
                onPressed: () => showOrcaToast(context, message: 'Saved', duration: const Duration(seconds: 2)),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Notify'));
    await tester.pump();
    expect(find.text('Saved'), findsOneWidget);
    await tester.pump(const Duration(seconds: 3));
    expect(find.text('Saved'), findsNothing);
  });

  group('OrcaEmptyState', () {
    testWidgets('title is a header, illustration is decorative, actions render in order', (WidgetTester tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(OrcaEmptyState(
        title: 'No results',
        description: 'Try another search',
        illustration: const SizedBox(key: Key('art'), height: 40, child: Text('ART')),
        primaryAction: OrcaButton(label: 'Clear filters', onPressed: () {}),
        secondaryAction: OrcaButton(label: 'Help', onPressed: () {}),
        tone: OrcaTone.danger,
      )));
      expect(find.text('No results'), findsOneWidget);
      expect(find.text('Try another search'), findsOneWidget);
      expect(tester.getSemantics(find.text('No results')), containsSemantics(isHeader: true));
      expect(find.bySemanticsLabel('ART'), findsNothing);
      expect(tester.getTopLeft(find.text('Clear filters')).dx, lessThan(tester.getTopLeft(find.text('Help')).dx));
      handle.dispose();
    });

    testWidgets('split places the illustration beside the text when wide', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1200, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_wrap(const SizedBox(
        width: 800,
        child: OrcaEmptyState(title: 'Inbox zero', split: true, illustration: SizedBox(key: Key('art'), width: 200, height: 150)),
      )));
      final Offset art = tester.getCenter(find.byKey(const Key('art')));
      final Offset title = tester.getCenter(find.text('Inbox zero'));
      expect(title.dx, greaterThan(art.dx));
      expect((title.dy - art.dy).abs(), lessThan(80));
    });

    testWidgets('legacy action and isHeader false still work', (WidgetTester tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(OrcaEmptyState(title: 'Empty', size: OrcaEmptyStateSize.compact, isHeader: false, action: OrcaButton(label: 'Add', onPressed: () {}))));
      expect(find.text('Add'), findsOneWidget);
      expect(tester.getSemantics(find.text('Empty')), containsSemantics(isHeader: false));
      handle.dispose();
    });
  });
}
