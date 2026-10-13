import 'package:flutter/widgets.dart';

import '../foundation/pressable.dart';
import '../theme/colors.dart';
import '../theme/pelagic_theme.dart';
import 'display.dart';

/// Visual style of a [PelagicButton].
enum PelagicButtonVariant {
  /// Filled accent.
  primary,

  /// Subtle filled.
  secondary,

  /// Accent outline.
  outline,

  /// Text only.
  ghost,

  /// Destructive.
  danger,
}

/// Size of a [PelagicButton]. The hit area is always at least 48x48.
enum PelagicButtonSize {
  /// Compact (36 visual height).
  sm,

  /// Default (44 visual height).
  md,

  /// Large (52 visual height).
  lg,
}

/// Button with variants, sizes and a loading state.
///
/// While [loading], the button is disabled, shows a spinner and exposes the
/// value "Loading" ([loadingLabel]) to screen readers.
class PelagicButton extends StatelessWidget {
  /// Creates a button.
  const PelagicButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = PelagicButtonVariant.primary,
    this.size = PelagicButtonSize.md,
    this.loading = false,
    this.block = false,
    this.icon,
    this.trailingIcon,
    this.semanticLabel,
    this.loadingLabel = 'Loading',
    this.focusNode,
    this.autofocus = false,
  });

  /// Visible text.
  final String label;

  /// Called when activated. Null disables the button.
  final VoidCallback? onPressed;

  /// Style.
  final PelagicButtonVariant variant;

  /// Size.
  final PelagicButtonSize size;

  /// Shows a spinner and disables the button.
  final bool loading;

  /// Stretch to the available width.
  final bool block;

  /// Leading icon (decorative).
  final Widget? icon;

  /// Trailing icon (decorative).
  final Widget? trailingIcon;

  /// Accessible name when [label] is not descriptive enough.
  final String? semanticLabel;

  /// Accessible value while loading.
  final String loadingLabel;

  /// Focus node.
  final FocusNode? focusNode;

  /// Autofocus.
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    final PelagicTheme t = PelagicTheme.of(context);
    final PelagicColors c = t.colors;
    final bool enabled = onPressed != null && !loading;
    final double height = switch (size) {
      PelagicButtonSize.sm => 36.0,
      PelagicButtonSize.md => 44.0,
      PelagicButtonSize.lg => 52.0,
    };
    final double fontSize = switch (size) {
      PelagicButtonSize.sm => PelagicFontSize.sm,
      PelagicButtonSize.md => PelagicFontSize.md,
      PelagicButtonSize.lg => PelagicFontSize.lg,
    };
    final double hPad = size == PelagicButtonSize.lg ? PelagicSpace.xl : PelagicSpace.lg;
    final BorderRadius radius = BorderRadius.circular(t.radii.md);

    return PelagicPressable(
      onPressed: enabled ? onPressed : null,
      focusNode: focusNode,
      autofocus: autofocus,
      borderRadius: radius,
      semanticLabel: semanticLabel,
      excludeChildSemantics: semanticLabel != null,
      semanticValue: loading ? loadingLabel : null,
      builder: (BuildContext context, Set<WidgetState> states) {
        final bool active = states.contains(WidgetState.hovered) || states.contains(WidgetState.pressed);
        final (Color bg, Color fg, Color border) = switch (variant) {
          PelagicButtonVariant.primary => (active ? c.primaryHover : c.primary, c.onPrimary, const Color(0x00000000)),
          PelagicButtonVariant.secondary => (
              active ? c.surfaceMuted : c.surfaceAlt,
              c.text,
              t.isHighContrast ? c.controlBorder : c.border,
            ),
          PelagicButtonVariant.outline => (active ? c.primarySoft : const Color(0x00000000), c.primaryInk, c.primary),
          PelagicButtonVariant.ghost => (
              active ? c.surfaceMuted : const Color(0x00000000),
              c.text,
              t.isHighContrast && active ? c.controlBorder : const Color(0x00000000),
            ),
          PelagicButtonVariant.danger => (
              active ? Color.alphaBlend(c.text.withAlpha(0x26), c.danger) : c.danger,
              c.onDanger,
              const Color(0x00000000),
            ),
        };
        final Widget face = Container(
          constraints: BoxConstraints(minHeight: height),
          padding: EdgeInsetsDirectional.symmetric(horizontal: hPad, vertical: PelagicSpace.xs),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: radius,
            border: Border.all(color: border, width: t.borderWidth),
          ),
          child: IconTheme.merge(
            data: IconThemeData(color: fg, size: fontSize + 3),
            child: Row(
              mainAxisSize: block ? MainAxisSize.max : MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                if (loading) ...<Widget>[
                  PelagicSpinner(size: PelagicSpinnerSize.sm, color: fg, label: null),
                  const SizedBox(width: PelagicSpace.sm),
                ] else if (icon != null) ...<Widget>[
                  ExcludeSemantics(child: icon),
                  const SizedBox(width: PelagicSpace.sm),
                ],
                Flexible(
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: fg, fontSize: fontSize, fontWeight: FontWeight.w600),
                  ),
                ),
                if (trailingIcon != null) ...<Widget>[
                  const SizedBox(width: PelagicSpace.sm),
                  ExcludeSemantics(child: trailingIcon),
                ],
              ],
            ),
          ),
        );
        return Opacity(
          opacity: onPressed == null || loading ? 0.55 : 1,
          child: Center(widthFactor: 1, heightFactor: 1, child: block ? SizedBox(width: double.infinity, child: face) : face),
        );
      },
    );
  }
}
