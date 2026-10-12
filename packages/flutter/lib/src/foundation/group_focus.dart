import 'package:flutter/widgets.dart';

/// Focus nodes for roving focus inside a group (tabs, radios, segments).
///
/// Nodes are created on demand and only disposed with the owner, so a node is
/// never disposed while a widget still uses it.
class NawaGroupFocus {
  /// Creates a node pool.
  NawaGroupFocus(this.debugLabel);

  /// Prefix of node debug labels.
  final String debugLabel;
  final List<FocusNode> _nodes = <FocusNode>[];

  /// The node of item [i].
  FocusNode operator [](int i) {
    while (_nodes.length <= i) {
      _nodes.add(FocusNode(debugLabel: '$debugLabel ${_nodes.length}'));
    }
    return _nodes[i];
  }

  /// Index of the focused item, or -1.
  int get focusedIndex => _nodes.indexWhere((FocusNode n) => n.hasFocus);

  /// Disposes every node.
  void dispose() {
    for (final FocusNode n in _nodes) {
      n.dispose();
    }
    _nodes.clear();
  }
}

/// Next enabled index from [from] by [delta], wrapping. Returns [from] when none is enabled.
int nawaNextEnabled(int from, int delta, int length, bool Function(int index) enabled) {
  if (length == 0) return from;
  int i = from < 0 ? (delta > 0 ? -1 : length) : from;
  for (int step = 0; step < length; step++) {
    i = (i + delta) % length;
    if (i < 0) i += length;
    if (enabled(i)) return i;
  }
  return from;
}

/// First (or [last]) enabled index, or -1.
int nawaEdgeEnabled(bool last, int length, bool Function(int index) enabled) {
  if (last) {
    for (int i = length - 1; i >= 0; i--) {
      if (enabled(i)) return i;
    }
  } else {
    for (int i = 0; i < length; i++) {
      if (enabled(i)) return i;
    }
  }
  return -1;
}
