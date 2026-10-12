import 'package:flutter/widgets.dart';

import '../foundation/pressable.dart';
import '../theme/colors.dart';
import '../theme/nawa_theme.dart';
import 'display.dart';

/// Visual style of a [NawaButton].
enum NawaButtonVariant {
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

/// Size of a [NawaButton]. The hit area is always at least 48x48.
enum NawaButtonSize {
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
class NawaButton extends StatelessWidget {
  /// Creates a button.
  const NawaButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = NawaButtonVariant.primary,
    this.size = NawaButtonSize.md,
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
  final NawaButtonVariant variant;

  /// Size.
  final NawaButtonSize size;

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
    final NawaTheme t = NawaTheme.of(context);
    final NawaColors c = t.colors;
    final bool enabled = onPressed != null && !loading;
    final double height = switch (size) {
      NawaButtonSize.sm => 36.0,
      NawaButtonSize.md => 44.0,
      NawaButtonSize.lg => 52.0,
    };
    final double fontSize = switch (size) {
      NawaButtonSize.sm => NawaFontSize.sm,
      NawaButtonSize.md => NawaFontSize.md,
      NawaButtonSize.lg => NawaFontSize.lg,
    };
    final double hPad = size == NawaButtonSize.lg ? NawaSpace.xl : NawaSpace.lg;
    final BorderRadius radius = BorderRadius.circular(t.radii.md);

    return NawaPressable(
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
          NawaButtonVariant.primary => (active ? c.primaryHover : c.primary, c.onPrimary, const Color(0x00000000)),
          NawaButtonVariant.secondary => (
              active ? c.surfaceMuted : c.surfaceAlt,
              c.text,
              t.isHighContrast ? c.controlBorder : c.border,
            ),
          NawaButtonVariant.outline => (active ? c.primarySoft : const Color(0x00000000), c.primaryInk, c.primary),
          NawaButtonVariant.ghost => (
              active ? c.surfaceMuted : const Color(0x00000000),
              c.text,
              t.isHighContrast && active ? c.controlBorder : const Color(0x00000000),
            ),
          NawaButtonVariant.danger => (
              active ? Color.alphaBlend(c.text.withAlpha(0x26), c.danger) : c.danger,
              c.onDanger,
              const Color(0x00000000),
            ),
        };
        final Widget face = Container(
          constraints: BoxConstraints(minHeight: height),
          padding: EdgeInsetsDirectional.symmetric(horizontal: hPad, vertical: NawaSpace.xs),
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
                  NawaSpinner(size: NawaSpinnerSize.sm, color: fg, label: null),
                  const SizedBox(width: NawaSpace.sm),
                ] else if (icon != null) ...<Widget>[
                  ExcludeSemantics(child: icon),
                  const SizedBox(width: NawaSpace.sm),
                ],
                Flexible(
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: fg, fontSize: fontSize, fontWeight: FontWeight.w600),
                  ),
                ),
                if (trailingIcon != null) ...<Widget>[
                  const SizedBox(width: NawaSpace.sm),
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
