import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../theme/orca_theme.dart';

/// Low-level accessible pressable surface used by every Orca control.
///
/// - Activates with tap, Enter and Space (through [ActivateIntent]).
/// - Shows a focus ring only for keyboard focus, and a hover/pressed state layer.
/// - Enforces a minimum tap target ([minSize], 48x48 by default).
/// - Exposes one semantics node with the given flags.
class OrcaPressable extends StatefulWidget {
  /// Creates a pressable.
  const OrcaPressable({
    super.key,
    this.child,
    this.builder,
    this.onPressed,
    this.focusNode,
    this.autofocus = false,
    this.requestFocusOnTap = false,
    this.borderRadius = BorderRadius.zero,
    this.minSize = const Size(orcaMinTapTarget, orcaMinTapTarget),
    this.stateLayerColor,
    this.semanticLabel,
    this.semanticHint,
    this.semanticValue,
    this.button = true,
    this.link = false,
    this.selected,
    this.checked,
    this.toggled,
    this.inMutuallyExclusiveGroup = false,
    this.excludeChildSemantics = false,
    this.onFocusChange,
    this.mouseCursor,
  }) : assert(child != null || builder != null, 'Provide child or builder');

  /// Content. A hover / pressed state layer is drawn over it.
  final Widget? child;

  /// Builds the content from the interaction states (hovered, pressed,
  /// focused, disabled). No state layer is drawn when a builder is used.
  final Widget Function(BuildContext context, Set<WidgetState> states)? builder;

  /// Called on activation. Null disables the control.
  final VoidCallback? onPressed;

  /// Optional focus node (for roving focus in groups).
  final FocusNode? focusNode;

  /// Request focus on first build.
  final bool autofocus;

  /// Move keyboard focus here when tapped (used by tabs and segmented controls).
  final bool requestFocusOnTap;

  /// Shape of the focus ring and state layer.
  final BorderRadiusGeometry borderRadius;

  /// Minimum size of the hit area.
  final Size minSize;

  /// Color of the hover / pressed state layer. Defaults to the theme text color.
  final Color? stateLayerColor;

  /// Accessible name. When set, the child's own semantics are excluded if
  /// [excludeChildSemantics] is true.
  final String? semanticLabel;

  /// Accessible hint.
  final String? semanticHint;

  /// Accessible value.
  final String? semanticValue;

  /// Exposed as a button.
  final bool button;

  /// Exposed as a link (breadcrumbs).
  final bool link;

  /// Selected state (tabs, segments, pages).
  final bool? selected;

  /// Checked state (checkbox, radio).
  final bool? checked;

  /// Toggled state (switch).
  final bool? toggled;

  /// Radio-like control in a group.
  final bool inMutuallyExclusiveGroup;

  /// Drop the semantics of [child] (use with [semanticLabel]).
  final bool excludeChildSemantics;

  /// Focus change callback.
  final ValueChanged<bool>? onFocusChange;

  /// Mouse cursor. Defaults to click when enabled.
  final MouseCursor? mouseCursor;

  @override
  State<OrcaPressable> createState() => _OrcaPressableState();
}

class _OrcaPressableState extends State<OrcaPressable> {
  FocusNode? _ownNode;
  bool _focused = false;
  bool _hovered = false;
  bool _pressed = false;

  FocusNode get _node => widget.focusNode ?? (_ownNode ??= FocusNode(debugLabel: 'OrcaPressable'));

  bool get _enabled => widget.onPressed != null;

  @override
  void dispose() {
    _ownNode?.dispose();
    super.dispose();
  }

  void _activate() {
    if (!_enabled) return;
    if (widget.requestFocusOnTap) _node.requestFocus();
    widget.onPressed!();
  }

  @override
  Widget build(BuildContext context) {
    final OrcaTheme orca = OrcaTheme.of(context);
    final Color layer = widget.stateLayerColor ?? orca.colors.text;
    final bool layered = widget.builder == null;
    final int alpha = !_enabled || !layered ? 0 : (_pressed ? 0x24 : (_hovered ? 0x12 : 0));
    final Set<WidgetState> states = <WidgetState>{
      if (!_enabled) WidgetState.disabled,
      if (_hovered) WidgetState.hovered,
      if (_pressed) WidgetState.pressed,
      if (_focused) WidgetState.focused,
    };
    final BorderRadius radius = widget.borderRadius.resolve(Directionality.of(context));

    Widget content = ConstrainedBox(
      constraints: BoxConstraints(minWidth: widget.minSize.width, minHeight: widget.minSize.height),
      child: widget.builder?.call(context, states) ?? widget.child,
    );

    content = DecoratedBox(
      position: DecorationPosition.foreground,
      decoration: BoxDecoration(
        color: alpha == 0 ? null : layer.withAlpha(alpha),
        borderRadius: radius,
        border: _focused ? Border.all(color: orca.colors.focus, width: 2) : null,
      ),
      child: content,
    );

    content = GestureDetector(
      behavior: HitTestBehavior.opaque,
      excludeFromSemantics: true,
      onTap: _enabled ? _activate : null,
      onTapDown: _enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: _enabled ? (_) => setState(() => _pressed = false) : null,
      onTapCancel: _enabled ? () => setState(() => _pressed = false) : null,
      child: content,
    );

    content = FocusableActionDetector(
      enabled: _enabled,
      focusNode: _node,
      autofocus: widget.autofocus,
      mouseCursor: widget.mouseCursor ?? (_enabled ? SystemMouseCursors.click : MouseCursor.defer),
      onFocusChange: widget.onFocusChange,
      onShowFocusHighlight: (bool value) {
        if (_focused != value) setState(() => _focused = value);
      },
      onShowHoverHighlight: (bool value) {
        if (_hovered != value) setState(() => _hovered = value);
      },
      actions: <Type, Action<Intent>>{
        ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) {
          _activate();
          return null;
        }),
        ButtonActivateIntent: CallbackAction<ButtonActivateIntent>(onInvoke: (_) {
          _activate();
          return null;
        }),
      },
      child: content,
    );

    return Semantics(
      container: true,
      button: widget.button && !widget.link,
      link: widget.link,
      enabled: _enabled,
      selected: widget.selected,
      checked: widget.checked,
      toggled: widget.toggled,
      inMutuallyExclusiveGroup: widget.inMutuallyExclusiveGroup ? true : null,
      label: widget.semanticLabel,
      hint: widget.semanticHint,
      value: widget.semanticValue,
      excludeSemantics: widget.excludeChildSemantics,
      onTap: _enabled ? _activate : null,
      child: content,
    );
  }
}

class _MoveIntent extends Intent {
  const _MoveIntent(this.delta);
  final int delta;
}

class _EdgeIntent extends Intent {
  const _EdgeIntent({required this.last});
  final bool last;
}

/// Arrow-key navigation for a group of controls (tabs, segments, pagination).
///
/// Left / Right (and Up / Down when [vertical]) call [onMove] with a logical
/// delta: +1 is "next" in reading order, so Right means previous in RTL.
/// Home / End call [onEdge].
class OrcaArrowKeys extends StatelessWidget {
  /// Creates the keyboard handler.
  const OrcaArrowKeys({
    super.key,
    required this.onMove,
    this.onEdge,
    this.vertical = false,
    required this.child,
  });

  /// Move by a logical delta (+1 next, -1 previous).
  final ValueChanged<int> onMove;

  /// Jump to the first (`false`) or last (`true`) item.
  final ValueChanged<bool>? onEdge;

  /// Also handle Up / Down.
  final bool vertical;

  /// The group.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final bool rtl = Directionality.of(context) == TextDirection.rtl;
    return Shortcuts(
      shortcuts: <ShortcutActivator, Intent>{
        const SingleActivator(LogicalKeyboardKey.arrowRight): _MoveIntent(rtl ? -1 : 1),
        const SingleActivator(LogicalKeyboardKey.arrowLeft): _MoveIntent(rtl ? 1 : -1),
        if (vertical) const SingleActivator(LogicalKeyboardKey.arrowDown): const _MoveIntent(1),
        if (vertical) const SingleActivator(LogicalKeyboardKey.arrowUp): const _MoveIntent(-1),
        if (onEdge != null) const SingleActivator(LogicalKeyboardKey.home): const _EdgeIntent(last: false),
        if (onEdge != null) const SingleActivator(LogicalKeyboardKey.end): const _EdgeIntent(last: true),
      },
      child: Actions(
        actions: <Type, Action<Intent>>{
          _MoveIntent: CallbackAction<_MoveIntent>(onInvoke: (_MoveIntent intent) {
            onMove(intent.delta);
            return null;
          }),
          _EdgeIntent: CallbackAction<_EdgeIntent>(onInvoke: (_EdgeIntent intent) {
            onEdge?.call(intent.last);
            return null;
          }),
        },
        child: child,
      ),
    );
  }
}
