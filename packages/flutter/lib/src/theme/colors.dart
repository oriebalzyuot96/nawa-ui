import 'dart:ui' show Brightness, Color;

import 'package:flutter/foundation.dart';

/// One fully resolved Pelagic UI color theme (one mode x one accent).
///
/// The values are generated from the same source as the web CSS
/// (`packages/core/src/themes.mjs`), see `lib/src/tokens.g.dart`.
@immutable
class PelagicColors {
  /// Creates a color theme. Prefer [PelagicTheme.resolve] over building one by hand.
  const PelagicColors({
    required this.brightness,
    required this.primary,
    required this.primaryHover,
    required this.primaryInk,
    required this.onPrimary,
    required this.primarySoft,
    required this.focus,
    required this.surface,
    required this.surfaceAlt,
    required this.surfaceMuted,
    required this.text,
    required this.textMuted,
    required this.border,
    required this.controlBorder,
    required this.success,
    required this.warning,
    required this.danger,
    required this.info,
    required this.onDanger,
    required this.successSoft,
    required this.warningSoft,
    required this.dangerSoft,
    required this.infoSoft,
    required this.overlay,
  });

  /// Whether this theme is light or dark.
  final Brightness brightness;

  /// Filled buttons and selected states.
  final Color primary;

  /// Hover / pressed fill of [primary] surfaces.
  final Color primaryHover;

  /// Accent text and links on surfaces.
  final Color primaryInk;

  /// Text and icons on [primary].
  final Color onPrimary;

  /// Soft accent tint (selected rows, badges).
  final Color primarySoft;

  /// Focus ring color.
  final Color focus;

  /// Page and card background.
  final Color surface;

  /// Slightly raised / alternate background.
  final Color surfaceAlt;

  /// Muted background (tracks, skeletons, segmented controls).
  final Color surfaceMuted;

  /// Body text.
  final Color text;

  /// Secondary text.
  final Color textMuted;

  /// Decorative borders and dividers.
  final Color border;

  /// Borders of inputs and other controls (at least 3:1 against the surface).
  final Color controlBorder;

  /// Success status color.
  final Color success;

  /// Warning status color.
  final Color warning;

  /// Danger / error status color.
  final Color danger;

  /// Informational status color.
  final Color info;

  /// Text and icons on [danger].
  final Color onDanger;

  /// Soft tint of [success].
  final Color successSoft;

  /// Soft tint of [warning].
  final Color warningSoft;

  /// Soft tint of [danger].
  final Color dangerSoft;

  /// Soft tint of [info].
  final Color infoSoft;

  /// Modal backdrop color (includes alpha).
  final Color overlay;

  /// Linear interpolation between two color themes.
  static PelagicColors lerp(PelagicColors a, PelagicColors b, double t) {
    Color l(Color x, Color y) => Color.lerp(x, y, t)!;
    return PelagicColors(
      brightness: t < 0.5 ? a.brightness : b.brightness,
      primary: l(a.primary, b.primary),
      primaryHover: l(a.primaryHover, b.primaryHover),
      primaryInk: l(a.primaryInk, b.primaryInk),
      onPrimary: l(a.onPrimary, b.onPrimary),
      primarySoft: l(a.primarySoft, b.primarySoft),
      focus: l(a.focus, b.focus),
      surface: l(a.surface, b.surface),
      surfaceAlt: l(a.surfaceAlt, b.surfaceAlt),
      surfaceMuted: l(a.surfaceMuted, b.surfaceMuted),
      text: l(a.text, b.text),
      textMuted: l(a.textMuted, b.textMuted),
      border: l(a.border, b.border),
      controlBorder: l(a.controlBorder, b.controlBorder),
      success: l(a.success, b.success),
      warning: l(a.warning, b.warning),
      danger: l(a.danger, b.danger),
      info: l(a.info, b.info),
      onDanger: l(a.onDanger, b.onDanger),
      successSoft: l(a.successSoft, b.successSoft),
      warningSoft: l(a.warningSoft, b.warningSoft),
      dangerSoft: l(a.dangerSoft, b.dangerSoft),
      infoSoft: l(a.infoSoft, b.infoSoft),
      overlay: l(a.overlay, b.overlay),
    );
  }

  List<Object> get _props => <Object>[
        brightness,
        primary,
        primaryHover,
        primaryInk,
        onPrimary,
        primarySoft,
        focus,
        surface,
        surfaceAlt,
        surfaceMuted,
        text,
        textMuted,
        border,
        controlBorder,
        success,
        warning,
        danger,
        info,
        onDanger,
        successSoft,
        warningSoft,
        dangerSoft,
        infoSoft,
        overlay,
      ];

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PelagicColors && listEquals(other._props, _props);
  }

  @override
  int get hashCode => Object.hashAll(_props);
}

/// Corner radii of a shape preset, in logical pixels.
@immutable
class PelagicRadii {
  /// Creates a radius set.
  const PelagicRadii({required this.sm, required this.md, required this.lg});

  /// Small radius (tags, skeleton lines, segments).
  final double sm;

  /// Medium radius (buttons, inputs, alerts).
  final double md;

  /// Large radius (cards, dialogs).
  final double lg;

  /// Fully rounded ends.
  static const double pill = 999;

  /// Linear interpolation between two radius sets.
  static PelagicRadii lerp(PelagicRadii a, PelagicRadii b, double t) => PelagicRadii(
        sm: a.sm + (b.sm - a.sm) * t,
        md: a.md + (b.md - a.md) * t,
        lg: a.lg + (b.lg - a.lg) * t,
      );

  @override
  bool operator ==(Object other) =>
      other is PelagicRadii && other.sm == sm && other.md == md && other.lg == lg;

  @override
  int get hashCode => Object.hash(sm, md, lg);
}

/// Integer RGB color math shared with the web build (`packages/core/scripts/color.mjs`).
abstract final class PelagicColorMath {
  /// Mixes two `0xRRGGBB` colors like CSS `color-mix(in srgb, a amount, b)`.
  ///
  /// Returns an opaque `0xFFRRGGBB` value. Rounds each channel the same way
  /// as the JavaScript build (`Math.round`), so results match the CSS tokens.
  static int mixRgb(int a, int b, double amount) {
    int channel(int shift) {
      final double ca = ((a >> shift) & 0xFF).toDouble();
      final double cb = ((b >> shift) & 0xFF).toDouble();
      return (ca * amount + cb * (1 - amount)).round().clamp(0, 255);
    }

    return 0xFF000000 | (channel(16) << 16) | (channel(8) << 8) | channel(0);
  }
}
