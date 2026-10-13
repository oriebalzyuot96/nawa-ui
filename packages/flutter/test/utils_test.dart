import 'package:flutter_test/flutter_test.dart';
import 'package:pelagic_ui/pelagic_ui.dart';

void main() {
  test('pelagicPageItems matches the web pagination', () {
    expect(pelagicPageItems(1, 5), <int?>[1, 2, 3, 4, 5]);
    expect(pelagicPageItems(1, 10), <int?>[1, 2, null, 10]);
    expect(pelagicPageItems(5, 10), <int?>[1, null, 4, 5, 6, null, 10]);
    expect(pelagicPageItems(10, 10), <int?>[1, null, 9, 10]);
  });

  test('pelagicInitials', () {
    expect(pelagicInitials('Lina Haddad'), 'LH');
    expect(pelagicInitials('  omar  '), 'O');
    expect(pelagicInitials('Sara Nasser Ali'), 'SN');
    expect(pelagicInitials(''), '');
  });

  test('pelagicCompareValues sorts nulls last and numbers naturally', () {
    final List<Object?> values = <Object?>[null, 'item 10', 'Item 2', 'apple'];
    values.sort(pelagicCompareValues);
    expect(values, <Object?>['apple', 'Item 2', 'item 10', null]);
    expect(pelagicCompareValues(2, 10), lessThan(0));
  });
}
