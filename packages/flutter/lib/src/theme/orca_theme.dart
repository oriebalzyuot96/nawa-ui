import 'package:flutter/material.dart';

import '../tokens.g.dart';
import 'colors.dart';

/// Spacing scale shared with the React Native package.
abstract final class OrcaSpace {
  /// 4
  static const double xs = 4;

  /// 8
  static const double sm = 8;

  /// 12
  static const double md = 12;

  /// 16
  static const double lg = 16;

  /// 24
  static const double xl = 24;
}

/// Font size scale (logical pixels, before the user's text scaling).
abstract final class OrcaFontSize {
  /// 12
  static const double xs = 12;

  /// 13
  static const double sm = 13;

  /// 15
  static const double md = 15;

  /// 17
  static const double lg = 17;

  /// 20
  static const double xl = 20;
}

/// Minimum interactive size (Material and WCAG 2.5.8 guidance).
const double orcaMinTapTarget = 48;

/// Theme mode setting. [system] follows the platform brightness and the
/// platform high-contrast setting (`MediaQuery.highContrastOf`).
enum OrcaThemeMode {
  /// Follow the device: high contrast when requested, else light or dark.
  system,

  /// Always light.
  light,

  /// Always dark.
  dark,

  /// Always high contrast.
  hc,
}

/// Orca UI design tokens, attached to [ThemeData.extensions].
///
/// Read them with `OrcaTheme.of(context)`.
@immutable
class OrcaTheme extends ThemeExtension<OrcaTheme> {
  /// Creates a theme extension from resolved tokens.
  const OrcaTheme({
    required this.colors,
    required this.radii,
    this.mode = orcaDefaultMode,
    this.accent = orcaDefaultAccent,
    this.shape = orcaDefaultShape,
  });

  /// Looks up the generated tokens for [mode] x [accent] and [shape].
  factory OrcaTheme.resolve({
    OrcaMode mode = orcaDefaultMode,
    OrcaAccent accent = orcaDefaultAccent,
    OrcaShape shape = orcaDefaultShape,
  }) {
    return OrcaTheme(
      colors: orcaColorThemes[mode]![accent]!,
      radii: orcaShapes[shape]!,
      mode: mode,
      accent: accent,
      shape: shape,
    );
  }

  /// Resolved colors.
  final OrcaColors colors;

  /// Corner radii.
  final OrcaRadii radii;

  /// Color mode these tokens were resolved for.
  final OrcaMode mode;

  /// Accent these tokens were resolved for.
  final OrcaAccent accent;

  /// Shape these tokens were resolved for.
  final OrcaShape shape;

  /// True for the high-contrast mode. Widgets draw thicker borders.
  bool get isHighContrast => mode == OrcaMode.hc;

  /// Width of control borders (2 in high contrast, else 1).
  double get borderWidth => isHighContrast ? 2 : 1;

  /// The Orca tokens of the nearest [Theme].
  ///
  /// When the theme was not built with [OrcaThemeData.build], falls back to the
  /// default accent in the light or dark mode matching the theme brightness.
  static OrcaTheme of(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return theme.extension<OrcaTheme>() ??
        OrcaTheme.resolve(
          mode: theme.brightness == Brightness.dark ? OrcaMode.dark : OrcaMode.light,
        );
  }

  /// The Orca tokens of the nearest [Theme], or null when none are attached.
  static OrcaTheme? maybeOf(BuildContext context) => Theme.of(context).extension<OrcaTheme>();

  @override
  OrcaTheme copyWith({
    OrcaColors? colors,
    OrcaRadii? radii,
    OrcaMode? mode,
    OrcaAccent? accent,
    OrcaShape? shape,
  }) {
    return OrcaTheme(
      colors: colors ?? this.colors,
      radii: radii ?? this.radii,
      mode: mode ?? this.mode,
      accent: accent ?? this.accent,
      shape: shape ?? this.shape,
    );
  }

  @override
  OrcaTheme lerp(covariant ThemeExtension<OrcaTheme>? other, double t) {
    if (other is! OrcaTheme) return this;
    return OrcaTheme(
      colors: OrcaColors.lerp(colors, other.colors, t),
      radii: OrcaRadii.lerp(radii, other.radii, t),
      mode: t < 0.5 ? mode : other.mode,
      accent: t < 0.5 ? accent : other.accent,
      shape: t < 0.5 ? shape : other.shape,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is OrcaTheme &&
      other.colors == colors &&
      other.radii == radii &&
      other.mode == mode &&
      other.accent == accent &&
      other.shape == shape;

  @override
  int get hashCode => Object.hash(colors, radii, mode, accent, shape);
}

/// Builds Material 3 [ThemeData] wired to the Orca tokens.
abstract final class OrcaThemeData {
  /// Resolves a [OrcaThemeMode] against the platform settings in [context].
  ///
  /// [OrcaThemeMode.system] returns [OrcaMode.hc] when the platform asks for
  /// high contrast, otherwise light or dark from the platform brightness.
  static OrcaMode resolveMode(BuildContext context, OrcaThemeMode mode) {
    switch (mode) {
      case OrcaThemeMode.light:
        return OrcaMode.light;
      case OrcaThemeMode.dark:
        return OrcaMode.dark;
      case OrcaThemeMode.hc:
        return OrcaMode.hc;
      case OrcaThemeMode.system:
        if (MediaQuery.maybeHighContrastOf(context) ?? false) return OrcaMode.hc;
        final Brightness brightness =
            MediaQuery.maybePlatformBrightnessOf(context) ?? Brightness.light;
        return brightness == Brightness.dark ? OrcaMode.dark : OrcaMode.light;
    }
  }

  /// A Material 3 theme for one mode x accent x shape, with [OrcaTheme] attached.
  static ThemeData build({
    OrcaMode mode = orcaDefaultMode,
    OrcaAccent accent = orcaDefaultAccent,
    OrcaShape shape = orcaDefaultShape,
    String? fontFamily,
  }) {
    final OrcaTheme orca = OrcaTheme.resolve(mode: mode, accent: accent, shape: shape);
    final OrcaColors c = orca.colors;
    final OrcaRadii r = orca.radii;
    final double bw = orca.borderWidth;

    final ColorScheme scheme = ColorScheme(
      brightness: c.brightness,
      primary: c.primary,
      onPrimary: c.onPrimary,
      primaryContainer: c.primarySoft,
      onPrimaryContainer: c.text,
      secondary: c.primary,
      onSecondary: c.onPrimary,
      secondaryContainer: c.primarySoft,
      onSecondaryContainer: c.text,
      tertiary: c.info,
      onTertiary: c.surface,
      tertiaryContainer: c.infoSoft,
      onTertiaryContainer: c.text,
      error: c.danger,
      onError: c.onDanger,
      errorContainer: c.dangerSoft,
      onErrorContainer: c.text,
      surface: c.surface,
      onSurface: c.text,
      onSurfaceVariant: c.textMuted,
      surfaceDim: c.surfaceMuted,
      surfaceBright: c.surface,
      surfaceContainerLowest: c.surface,
      surfaceContainerLow: c.surfaceAlt,
      surfaceContainer: c.surfaceAlt,
      surfaceContainerHigh: c.surfaceMuted,
      surfaceContainerHighest: c.surfaceMuted,
      outline: c.controlBorder,
      outlineVariant: c.border,
      shadow: const Color(0xFF000000),
      scrim: c.overlay,
      inverseSurface: c.text,
      onInverseSurface: c.surface,
      inversePrimary: c.primarySoft,
      surfaceTint: const Color(0x00000000),
    );

    final RoundedRectangleBorder controlShape =
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(r.md));
    OutlineInputBorder outline(Color color, double width) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(r.md),
          borderSide: BorderSide(color: color, width: width),
        );
    const Size minButton = Size(orcaMinTapTarget, orcaMinTapTarget);
    const EdgeInsetsGeometry buttonPadding = EdgeInsetsDirectional.symmetric(horizontal: OrcaSpace.lg);

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: fontFamily,
      scaffoldBackgroundColor: c.surface,
      canvasColor: c.surface,
      dividerColor: c.border,
      focusColor: c.focus.withAlpha(0x33),
      hoverColor: c.text.withAlpha(0x0F),
      splashColor: c.primary.withAlpha(0x1F),
      highlightColor: c.primary.withAlpha(0x14),
      disabledColor: c.textMuted,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      visualDensity: VisualDensity.standard,
      extensions: <ThemeExtension<dynamic>>[orca],
      iconTheme: IconThemeData(color: c.text),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: c.primary,
        selectionColor: c.primary.withAlpha(0x55),
        selectionHandleColor: c.primary,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surface,
        isDense: false,
        contentPadding: const EdgeInsetsDirectional.symmetric(
          horizontal: OrcaSpace.md,
          vertical: OrcaSpace.md,
        ),
        hintStyle: TextStyle(color: c.textMuted),
        labelStyle: TextStyle(color: c.text),
        floatingLabelStyle: TextStyle(color: c.primaryInk),
        helperStyle: TextStyle(color: c.textMuted),
        errorStyle: TextStyle(color: c.danger),
        border: outline(c.controlBorder, bw),
        enabledBorder: outline(c.controlBorder, bw),
        focusedBorder: outline(c.focus, 2),
        errorBorder: outline(c.danger, bw),
        focusedErrorBorder: outline(c.danger, 2),
        disabledBorder: outline(c.border, 1),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.primary,
          foregroundColor: c.onPrimary,
          minimumSize: minButton,
          padding: buttonPadding,
          shape: controlShape,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.primary,
          foregroundColor: c.onPrimary,
          minimumSize: minButton,
          padding: buttonPadding,
          shape: controlShape,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.primaryInk,
          side: BorderSide(color: c.primary, width: bw),
          minimumSize: minButton,
          padding: buttonPadding,
          shape: controlShape,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.primaryInk,
          minimumSize: minButton,
          padding: buttonPadding,
          shape: controlShape,
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith<Color?>(
          (Set<WidgetState> states) =>
              states.contains(WidgetState.selected) ? c.primary : const Color(0x00000000),
        ),
        checkColor: WidgetStatePropertyAll<Color>(c.onPrimary),
        side: BorderSide(color: c.controlBorder, width: bw + 0.5),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith<Color?>(
          (Set<WidgetState> states) =>
              states.contains(WidgetState.selected) ? c.primary : c.controlBorder,
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith<Color?>(
          (Set<WidgetState> states) =>
              states.contains(WidgetState.selected) ? c.onPrimary : c.controlBorder,
        ),
        trackColor: WidgetStateProperty.resolveWith<Color?>(
          (Set<WidgetState> states) =>
              states.contains(WidgetState.selected) ? c.primary : c.surfaceMuted,
        ),
        trackOutlineColor: WidgetStateProperty.resolveWith<Color?>(
          (Set<WidgetState> states) =>
              states.contains(WidgetState.selected) ? c.primary : c.controlBorder,
        ),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: c.primary,
        inactiveTrackColor: c.surfaceMuted,
        thumbColor: c.primary,
        overlayColor: c.primary.withAlpha(0x29),
        valueIndicatorColor: c.text,
        valueIndicatorTextStyle: TextStyle(color: c.surface),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.primary,
        linearTrackColor: c.surfaceMuted,
        circularTrackColor: c.surfaceMuted,
      ),
      dividerTheme: DividerThemeData(color: c.border, thickness: 1, space: 1),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.text,
          borderRadius: BorderRadius.circular(r.sm),
        ),
        textStyle: TextStyle(color: c.surface, fontSize: OrcaFontSize.sm),
        waitDuration: const Duration(milliseconds: 400),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.text,
        contentTextStyle: TextStyle(color: c.surface),
        actionTextColor: c.surface,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

/// Applies an Orca theme to a subtree, resolving [OrcaThemeMode.system]
/// against the platform brightness and high-contrast setting.
class OrcaThemeScope extends StatelessWidget {
  /// Creates a theme scope.
  const OrcaThemeScope({
    super.key,
    this.mode = OrcaThemeMode.system,
    this.accent = orcaDefaultAccent,
    this.shape = orcaDefaultShape,
    required this.child,
  });

  /// Mode setting.
  final OrcaThemeMode mode;

  /// Accent.
  final OrcaAccent accent;

  /// Shape.
  final OrcaShape shape;

  /// Subtree.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: OrcaThemeData.build(
        mode: OrcaThemeData.resolveMode(context, mode),
        accent: accent,
        shape: shape,
      ),
      child: child,
    );
  }
}

/// A [MaterialApp] preconfigured with Orca themes.
///
/// With [mode] set to [OrcaThemeMode.system] (the default) the app follows the
/// platform brightness, and switches to the high-contrast theme when the
/// platform requests it (`MediaQuery.highContrastOf`).
class OrcaApp extends StatelessWidget {
  /// Creates an Orca-themed Material app.
  const OrcaApp({
    super.key,
    this.mode = OrcaThemeMode.system,
    this.accent = orcaDefaultAccent,
    this.shape = orcaDefaultShape,
    this.fontFamily,
    this.title = '',
    this.home,
    this.routes = const <String, WidgetBuilder>{},
    this.initialRoute,
    this.onGenerateRoute,
    this.navigatorKey,
    this.scaffoldMessengerKey,
    this.builder,
    this.locale,
    this.localizationsDelegates,
    this.supportedLocales = const <Locale>[Locale('en', 'US')],
    this.debugShowCheckedModeBanner = true,
  });

  /// Mode setting.
  final OrcaThemeMode mode;

  /// Accent.
  final OrcaAccent accent;

  /// Shape.
  final OrcaShape shape;

  /// Optional font family for all text.
  final String? fontFamily;

  /// See [MaterialApp.title].
  final String title;

  /// See [MaterialApp.home].
  final Widget? home;

  /// See [MaterialApp.routes].
  final Map<String, WidgetBuilder> routes;

  /// See [MaterialApp.initialRoute].
  final String? initialRoute;

  /// See [MaterialApp.onGenerateRoute].
  final RouteFactory? onGenerateRoute;

  /// See [MaterialApp.navigatorKey].
  final GlobalKey<NavigatorState>? navigatorKey;

  /// See [MaterialApp.scaffoldMessengerKey].
  final GlobalKey<ScaffoldMessengerState>? scaffoldMessengerKey;

  /// See [MaterialApp.builder].
  final TransitionBuilder? builder;

  /// See [MaterialApp.locale].
  final Locale? locale;

  /// See [MaterialApp.localizationsDelegates].
  final Iterable<LocalizationsDelegate<dynamic>>? localizationsDelegates;

  /// See [MaterialApp.supportedLocales].
  final Iterable<Locale> supportedLocales;

  /// See [MaterialApp.debugShowCheckedModeBanner].
  final bool debugShowCheckedModeBanner;

  ThemeData _theme(OrcaMode m) =>
      OrcaThemeData.build(mode: m, accent: accent, shape: shape, fontFamily: fontFamily);

  @override
  Widget build(BuildContext context) {
    final ThemeData theme;
    final ThemeData? darkTheme;
    final ThemeData? hcTheme;
    final ThemeMode themeMode;
    switch (mode) {
      case OrcaThemeMode.system:
        theme = _theme(OrcaMode.light);
        darkTheme = _theme(OrcaMode.dark);
        hcTheme = _theme(OrcaMode.hc);
        themeMode = ThemeMode.system;
      case OrcaThemeMode.light:
        theme = _theme(OrcaMode.light);
        darkTheme = null;
        hcTheme = null;
        themeMode = ThemeMode.light;
      case OrcaThemeMode.dark:
        theme = _theme(OrcaMode.dark);
        darkTheme = theme;
        hcTheme = null;
        themeMode = ThemeMode.dark;
      case OrcaThemeMode.hc:
        theme = _theme(OrcaMode.hc);
        darkTheme = theme;
        hcTheme = theme;
        themeMode = ThemeMode.light;
    }
    return MaterialApp(
      title: title,
      home: home,
      routes: routes,
      initialRoute: initialRoute,
      onGenerateRoute: onGenerateRoute,
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: scaffoldMessengerKey,
      builder: builder,
      locale: locale,
      localizationsDelegates: localizationsDelegates,
      supportedLocales: supportedLocales,
      debugShowCheckedModeBanner: debugShowCheckedModeBanner,
      theme: theme,
      darkTheme: darkTheme,
      highContrastTheme: hcTheme,
      highContrastDarkTheme: hcTheme,
      themeMode: themeMode,
    );
  }
}
