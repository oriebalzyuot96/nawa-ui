import 'package:flutter/semantics.dart';
import 'package:flutter/widgets.dart';

/// One entry of a compact page list: a page number, or null for an ellipsis.
typedef NawaPageItem = int?;

/// Compact page list for pagination: `1 … 4 5 6 … 10` (1-based, null = ellipsis).
///
/// Same algorithm as `getPageItems` in the React and React Native packages.
List<int?> nawaPageItems(int page, int pageCount) {
  if (pageCount <= 7) {
    return List<int?>.generate(pageCount, (int i) => i + 1);
  }
  final List<int?> items = <int?>[1];
  final int start = page - 1 < 2 ? 2 : page - 1;
  final int end = page + 1 > pageCount - 1 ? pageCount - 1 : page + 1;
  if (start > 2) items.add(null);
  for (int p = start; p <= end; p++) {
    items.add(p);
  }
  if (end < pageCount - 1) items.add(null);
  items.add(pageCount);
  return items;
}

/// Up to two initials from a name: "Lina Haddad" -> "LH".
String nawaInitials(String name) {
  final List<String> parts =
      name.trim().split(RegExp(r'\s+')).where((String p) => p.isNotEmpty).take(2).toList();
  return parts.map((String p) => String.fromCharCodes(p.runes.take(1)).toUpperCase()).join();
}

/// Compares two cell values for sorting: nulls last, numbers numerically,
/// everything else as case-insensitive text with numeric runs compared as numbers.
int nawaCompareValues(Object? a, Object? b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a is num && b is num) return a.compareTo(b);
  if (a is DateTime && b is DateTime) return a.compareTo(b);
  return _naturalCompare(a.toString().toLowerCase(), b.toString().toLowerCase());
}

final RegExp _chunk = RegExp(r'(\d+|\D+)');

int _naturalCompare(String a, String b) {
  final List<String> ca = _chunk.allMatches(a).map((Match m) => m.group(0)!).toList();
  final List<String> cb = _chunk.allMatches(b).map((Match m) => m.group(0)!).toList();
  for (int i = 0; i < ca.length && i < cb.length; i++) {
    final int? na = int.tryParse(ca[i]);
    final int? nb = int.tryParse(cb[i]);
    final int result = (na != null && nb != null) ? na.compareTo(nb) : ca[i].compareTo(cb[i]);
    if (result != 0) return result;
  }
  return ca.length.compareTo(cb.length);
}

/// Announces [message] to screen readers (polite), in the ambient text direction.
void nawaAnnounce(BuildContext context, String message) {
  final TextDirection direction = Directionality.maybeOf(context) ?? TextDirection.ltr;
  // ignore: deprecated_member_use
  SemanticsService.announce(message, direction);
}
