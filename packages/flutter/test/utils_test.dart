import 'package:flutter_test/flutter_test.dart';
import 'package:orca_ui/orca_ui.dart';

void main() {
  test('orcaPageItems matches the web pagination', () {
    expect(orcaPageItems(1, 5), <int?>[1, 2, 3, 4, 5]);
    expect(orcaPageItems(1, 10), <int?>[1, 2, null, 10]);
    expect(orcaPageItems(5, 10), <int?>[1, null, 4, 5, 6, null, 10]);
    expect(orcaPageItems(10, 10), <int?>[1, null, 9, 10]);
  });

  test('orcaInitials', () {
    expect(orcaInitials('Lina Haddad'), 'LH');
    expect(orcaInitials('  omar  '), 'O');
    expect(orcaInitials('Sara Nasser Ali'), 'SN');
    expect(orcaInitials(''), '');
  });

  test('orcaCompareValues sorts nulls last and numbers naturally', () {
    final List<Object?> values = <Object?>[null, 'item 10', 'Item 2', 'apple'];
    values.sort(orcaCompareValues);
    expect(values, <Object?>['apple', 'Item 2', 'item 10', null]);
    expect(orcaCompareValues(2, 10), lessThan(0));
  });
}
