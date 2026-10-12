import 'dart:async';

import 'package:flutter/material.dart';

import '../foundation/pressable.dart';
import '../foundation/utils.dart';
import '../theme/colors.dart';
import '../theme/nawa_theme.dart';
import 'display.dart';

bool _reduceMotion(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

/// Width preset of a [NawaDialog].
enum NawaDialogSize {
  /// 400
  sm,

  /// 560
  md,

  /// 760
  lg,
}

class _CloseButton extends StatelessWidget {
  const _CloseButton({required this.onPressed, required this.label});

  final VoidCallback onPressed;
  final String label;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    return NawaPressable(
      onPressed: onPressed,
      semanticLabel: label,
      excludeChildSemantics: true,
      borderRadius: BorderRadius.circular(t.radii.md),
      child: Center(
        widthFactor: 1,
        heightFactor: 1,
        child: Icon(Icons.close, color: t.colors.textMuted, size: 20),
      ),
    );
  }
}

Widget _panelHeader(BuildContext context, String title, VoidCallback? onClose, String closeLabel) {
  final NawaColors c = NawaTheme.of(context).colors;
  return DecoratedBox(
    decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.border))),
    child: Padding(
      padding: EdgeInsetsDirectional.only(
        start: NawaSpace.lg,
        end: onClose == null ? NawaSpace.lg : NawaSpace.xs,
        top: NawaSpace.xs,
        bottom: NawaSpace.xs,
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: nawaMinTapTarget),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Semantics(
                header: true,
                child: Text(
                  title,
                  style: TextStyle(color: c.text, fontSize: NawaFontSize.lg, fontWeight: FontWeight.w700),
                ),
              ),
            ),
            if (onClose != null) _CloseButton(onPressed: onClose, label: closeLabel),
          ],
        ),
      ),
    ),
  );
}

Widget _panelFooter(BuildContext context, List<Widget> actions) {
  final NawaColors c = NawaTheme.of(context).colors;
  return DecoratedBox(
    decoration: BoxDecoration(border: Border(top: BorderSide(color: c.border))),
    child: Padding(
      padding: const EdgeInsetsDirectional.all(NawaSpace.md),
      child: Wrap(
        alignment: WrapAlignment.end,
        spacing: NawaSpace.sm,
        runSpacing: NawaSpace.sm,
        children: actions,
      ),
    ),
  );
}

/// Modal dialog panel. Show it with [showNawaDialog].
///
/// Focus moves into the dialog and is kept there (modal route), Escape and
/// the close button dismiss it, and focus returns to the opener on close.
class NawaDialog extends StatelessWidget {
  /// Creates a dialog panel.
  const NawaDialog({
    super.key,
    required this.title,
    this.child,
    this.actions = const <Widget>[],
    this.onClose,
    this.closeLabel = 'Close',
    this.size = NawaDialogSize.md,
  });

  /// Title (announced as the dialog name).
  final String title;

  /// Body (scrolls when tall).
  final Widget? child;

  /// Footer buttons.
  final List<Widget> actions;

  /// Close button callback. Null hides the button.
  final VoidCallback? onClose;

  /// Accessible name of the close button.
  final String closeLabel;

  /// Width preset.
  final NawaDialogSize size;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final double maxWidth = switch (size) {
      NawaDialogSize.sm => 400.0,
      NawaDialogSize.md => 560.0,
      NawaDialogSize.lg => 760.0,
    };
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsetsDirectional.all(NawaSpace.lg),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Semantics(
              scopesRoute: true,
              namesRoute: true,
              explicitChildNodes: true,
              label: title,
              child: Material(
                color: t.colors.surface,
                elevation: 12,
                shadowColor: const Color(0x66000000),
                clipBehavior: Clip.antiAlias,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(t.radii.lg),
                  side: t.isHighContrast ? BorderSide(color: t.colors.controlBorder, width: 2) : BorderSide.none,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    _panelHeader(context, title, onClose, closeLabel),
                    if (child != null)
                      Flexible(
                        child: SingleChildScrollView(
                          padding: const EdgeInsetsDirectional.all(NawaSpace.lg),
                          child: child,
                        ),
                      ),
                    if (actions.isNotEmpty) _panelFooter(context, actions),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Shows a modal [NawaDialog] and returns the value it was popped with.
///
/// The [builder] receives the dialog context; call `Navigator.pop(context, value)`
/// from your actions. Tapping the backdrop or pressing Escape dismisses the
/// dialog when [barrierDismissible] is true.
Future<T?> showNawaDialog<T>({
  required BuildContext context,
  required String title,
  required WidgetBuilder builder,
  List<Widget> Function(BuildContext context)? actionsBuilder,
  bool barrierDismissible = true,
  bool showCloseButton = true,
  String closeLabel = 'Close',
  String barrierLabel = 'Dismiss',
  NawaDialogSize size = NawaDialogSize.md,
  bool useRootNavigator = true,
}) {
  final NawaColors c = NawaTheme.of(context).colors;
  return showDialog<T>(
    context: context,
    barrierDismissible: barrierDismissible,
    barrierColor: c.overlay,
    barrierLabel: barrierLabel,
    useRootNavigator: useRootNavigator,
    builder: (BuildContext dialogContext) => NawaDialog(
      title: title,
      size: size,
      closeLabel: closeLabel,
      onClose: showCloseButton ? () => Navigator.of(dialogContext).pop() : null,
      actions: actionsBuilder?.call(dialogContext) ?? const <Widget>[],
      child: builder(dialogContext),
    ),
  );
}

/// Side of a [NawaDrawer]. Logical: `end` is the right edge in LTR.
enum NawaDrawerSide {
  /// Leading edge.
  start,

  /// Trailing edge.
  end,
}

/// Side sheet panel. Show it with [showNawaDrawer].
class NawaDrawer extends StatelessWidget {
  /// Creates a drawer panel.
  const NawaDrawer({
    super.key,
    required this.title,
    this.child,
    this.actions = const <Widget>[],
    this.onClose,
    this.closeLabel = 'Close',
    this.width = 380,
  });

  /// Title (announced as the drawer name).
  final String title;

  /// Body.
  final Widget? child;

  /// Footer buttons.
  final List<Widget> actions;

  /// Close button callback. Null hides the button.
  final VoidCallback? onClose;

  /// Accessible name of the close button.
  final String closeLabel;

  /// Max width.
  final double width;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final double screen = MediaQuery.sizeOf(context).width;
    return Semantics(
      scopesRoute: true,
      namesRoute: true,
      explicitChildNodes: true,
      label: title,
      child: Material(
        color: t.colors.surface,
        elevation: 16,
        child: SizedBox(
          width: screen * 0.85 < width ? screen * 0.85 : width,
          height: double.infinity,
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                _panelHeader(context, title, onClose, closeLabel),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsetsDirectional.all(NawaSpace.lg),
                    child: child,
                  ),
                ),
                if (actions.isNotEmpty) _panelFooter(context, actions),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Shows a modal [NawaDrawer] sliding in from [side].
///
/// The slide is skipped when animations are disabled.
Future<T?> showNawaDrawer<T>({
  required BuildContext context,
  required String title,
  required WidgetBuilder builder,
  List<Widget> Function(BuildContext context)? actionsBuilder,
  NawaDrawerSide side = NawaDrawerSide.end,
  bool barrierDismissible = true,
  String closeLabel = 'Close',
  String barrierLabel = 'Dismiss',
  double width = 380,
}) {
  final NawaColors c = NawaTheme.of(context).colors;
  final bool reduce = _reduceMotion(context);
  return showGeneralDialog<T>(
    context: context,
    barrierDismissible: barrierDismissible,
    barrierLabel: barrierLabel,
    barrierColor: c.overlay,
    transitionDuration: reduce ? Duration.zero : const Duration(milliseconds: 220),
    pageBuilder: (BuildContext dialogContext, Animation<double> a, Animation<double> b) {
      return Align(
        alignment: side == NawaDrawerSide.end ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
        child: NawaDrawer(
          title: title,
          width: width,
          closeLabel: closeLabel,
          onClose: () => Navigator.of(dialogContext).pop(),
          actions: actionsBuilder?.call(dialogContext) ?? const <Widget>[],
          child: builder(dialogContext),
        ),
      );
    },
    transitionBuilder: (BuildContext ctx, Animation<double> animation, Animation<double> secondary, Widget child) {
      final bool rtl = Directionality.of(ctx) == TextDirection.rtl;
      final bool fromRight = (side == NawaDrawerSide.end) != rtl;
      return SlideTransition(
        position: Tween<Offset>(begin: Offset(fromRight ? 1 : -1, 0), end: Offset.zero)
            .chain(CurveTween(curve: Curves.easeOutCubic))
            .animate(animation),
        child: child,
      );
    },
  );
}

/// Handle to a shown toast.
class NawaToastHandle {
  NawaToastHandle._(this._host, this._entry);

  final _ToastHost _host;
  final _ToastEntry _entry;

  /// Removes the toast now.
  void dismiss() => _host.remove(_entry);
}

class _ToastEntry {
  _ToastEntry({
    required this.message,
    required this.title,
    required this.tone,
    required this.duration,
    required this.dismissLabel,
    required this.actionLabel,
    required this.onAction,
  });

  final String message;
  final String? title;
  final NawaTone tone;
  final Duration? duration;
  final String dismissLabel;
  final String? actionLabel;
  final VoidCallback? onAction;
}

/// One stack of toasts per [OverlayState], kept in a single [OverlayEntry].
class _ToastHost {
  _ToastHost(this.overlay);

  final OverlayState overlay;
  final ValueNotifier<List<_ToastEntry>> items = ValueNotifier<List<_ToastEntry>>(<_ToastEntry>[]);
  OverlayEntry? _entry;

  static final Expando<_ToastHost> _hosts = Expando<_ToastHost>('NawaToastHost');

  static _ToastHost of(OverlayState overlay) => _hosts[overlay] ??= _ToastHost(overlay);

  void add(_ToastEntry item, int maxVisible) {
    final List<_ToastEntry> next = <_ToastEntry>[...items.value, item];
    items.value = next.length > maxVisible ? next.sublist(next.length - maxVisible) : next;
    if (_entry == null) {
      _entry = OverlayEntry(builder: (BuildContext context) => _ToastStack(host: this));
      overlay.insert(_entry!);
    }
  }

  void remove(_ToastEntry item) {
    if (!items.value.contains(item)) return;
    items.value = items.value.where((_ToastEntry e) => !identical(e, item)).toList();
    if (items.value.isEmpty) {
      _entry?.remove();
      _entry?.dispose();
      _entry = null;
    }
  }
}

/// Shows a toast above the app, at the bottom of the screen.
///
/// The toast is announced to screen readers. It disappears after [duration]
/// (pass null to keep it until dismissed); the timer pauses while the toast has
/// keyboard focus or the pointer hovers it, so people have time to read and act.
NawaToastHandle showNawaToast(
  BuildContext context, {
  required String message,
  String? title,
  NawaTone tone = NawaTone.info,
  Duration? duration = const Duration(seconds: 5),
  String dismissLabel = 'Dismiss',
  String? actionLabel,
  VoidCallback? onAction,
  int maxVisible = 3,
}) {
  final OverlayState overlay = Overlay.of(context, rootOverlay: true);
  final _ToastHost host = _ToastHost.of(overlay);
  final _ToastEntry entry = _ToastEntry(
    message: message,
    title: title,
    tone: tone,
    duration: duration,
    dismissLabel: dismissLabel,
    actionLabel: actionLabel,
    onAction: onAction,
  );
  host.add(entry, maxVisible);
  nawaAnnounce(context, title == null ? message : '$title. $message');
  return NawaToastHandle._(host, entry);
}

class _ToastStack extends StatelessWidget {
  const _ToastStack({required this.host});

  final _ToastHost host;

  @override
  Widget build(BuildContext context) {
    return PositionedDirectional(
      start: 0,
      end: 0,
      bottom: 0,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsetsDirectional.all(NawaSpace.lg),
          child: Align(
            alignment: AlignmentDirectional.bottomCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: ValueListenableBuilder<List<_ToastEntry>>(
                valueListenable: host.items,
                builder: (BuildContext context, List<_ToastEntry> items, Widget? _) {
                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: <Widget>[
                      for (final _ToastEntry item in items)
                        Padding(
                          key: ObjectKey(item),
                          padding: const EdgeInsetsDirectional.only(top: NawaSpace.sm),
                          child: _Toast(item: item, onDismiss: () => host.remove(item)),
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
  }
}

class _Toast extends StatefulWidget {
  const _Toast({required this.item, required this.onDismiss});

  final _ToastEntry item;
  final VoidCallback onDismiss;

  @override
  State<_Toast> createState() => _ToastState();
}

class _ToastState extends State<_Toast> {
  Timer? _timer;
  final Stopwatch _elapsed = Stopwatch();
  bool _focused = false;
  bool _hovered = false;

  Duration get _remaining {
    final Duration? total = widget.item.duration;
    if (total == null) return Duration.zero;
    final Duration left = total - _elapsed.elapsed;
    return left.isNegative ? Duration.zero : left;
  }

  @override
  void initState() {
    super.initState();
    _resume();
  }

  void _resume() {
    if (widget.item.duration == null || _timer != null) return;
    _elapsed.start();
    _timer = Timer(_remaining, widget.onDismiss);
  }

  void _pause() {
    _timer?.cancel();
    _timer = null;
    _elapsed.stop();
  }

  void _update() {
    if (_focused || _hovered) {
      _pause();
    } else {
      _resume();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final NawaColors c = t.colors;
    final ({Color fg, Color bg}) tone = nawaToneColors(c, widget.item.tone);
    return Focus(
      canRequestFocus: false,
      skipTraversal: true,
      onFocusChange: (bool value) {
        _focused = value;
        _update();
      },
      child: MouseRegion(
        onEnter: (_) {
          _hovered = true;
          _update();
        },
        onExit: (_) {
          _hovered = false;
          _update();
        },
        child: Semantics(
          container: true,
          liveRegion: true,
          child: Material(
            color: c.surface,
            elevation: 6,
            shadowColor: const Color(0x55000000),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(t.radii.md),
              side: BorderSide(color: t.isHighContrast ? c.controlBorder : c.border, width: t.borderWidth),
            ),
            clipBehavior: Clip.antiAlias,
            child: DecoratedBox(
              decoration: BoxDecoration(
                border: BorderDirectional(start: BorderSide(color: tone.fg, width: 4)),
              ),
              child: Padding(
                padding: const EdgeInsetsDirectional.only(start: NawaSpace.md, top: NawaSpace.xs, bottom: NawaSpace.xs),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsetsDirectional.symmetric(vertical: NawaSpace.sm),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            if (widget.item.title != null)
                              Text(
                                widget.item.title!,
                                style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: NawaFontSize.sm),
                              ),
                            Text(widget.item.message, style: TextStyle(color: c.textMuted, fontSize: NawaFontSize.sm)),
                          ],
                        ),
                      ),
                    ),
                    if (widget.item.actionLabel != null)
                      NawaPressable(
                        onPressed: () {
                          widget.item.onAction?.call();
                          widget.onDismiss();
                        },
                        borderRadius: BorderRadius.circular(t.radii.sm),
                        child: Center(
                          widthFactor: 1,
                          heightFactor: 1,
                          child: Padding(
                            padding: const EdgeInsetsDirectional.symmetric(horizontal: NawaSpace.sm),
                            child: Text(
                              widget.item.actionLabel!,
                              style: TextStyle(color: c.primaryInk, fontWeight: FontWeight.w700, fontSize: NawaFontSize.sm),
                            ),
                          ),
                        ),
                      ),
                    _CloseButton(onPressed: widget.onDismiss, label: widget.item.dismissLabel),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
