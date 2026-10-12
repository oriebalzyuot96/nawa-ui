import 'package:flutter_test/flutter_test.dart';
import 'package:nawa_ui/nawa_ui.dart';

void main() {
  test('nawaPageItems matches the web pagination', () {
    expect(nawaPageItems(1, 5), <int?>[1, 2, 3, 4, 5]);
    expect(nawaPageItems(1, 10), <int?>[1, 2, null, 10]);
    expect(nawaPageItems(5, 10), <int?>[1, null, 4, 5, 6, null, 10]);
    expect(nawaPageItems(10, 10), <int?>[1, null, 9, 10]);
  });

  test('nawaInitials', () {
    expect(nawaInitials('Lina Haddad'), 'LH');
    expect(nawaInitials('  omar  '), 'O');
    expect(nawaInitials('Sara Nasser Ali'), 'SN');
    expect(nawaInitials(''), '');
  });

  test('nawaCompareValues sorts nulls last and numbers naturally', () {
    final List<Object?> values = <Object?>[null, 'item 10', 'Item 2', 'apple'];
    values.sort(nawaCompareValues);
    expect(values, <Object?>['apple', 'Item 2', 'item 10', null]);
    expect(nawaCompareValues(2, 10), lessThan(0));
  });
}
