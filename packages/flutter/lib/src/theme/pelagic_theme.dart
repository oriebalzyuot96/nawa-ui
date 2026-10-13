import 'package:flutter/material.dart';

import '../tokens.g.dart';
import 'colors.dart';

/// Spacing scale shared with the React Native package.
abstract final class PelagicSpace {
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
abstract final class PelagicFontSize {
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
const double pelagicMinTapTarget = 48;

/// Theme mode setting. [system] follows the platform brightness and the
/// platform high-contrast setting (`MediaQuery.highContrastOf`).
enum PelagicThemeMode {
  /// Follow the device: high contrast when requested, else light or dark.
  system,

  /// Always light.
  light,

  /// Always dark.
  dark,

  /// Always high contrast.
  hc,
}

/// Pelagic UI design tokens, attached to [ThemeData.extensions].
///
/// Read them with `PelagicTheme.of(context)`.
@immutable
class PelagicTheme extends ThemeExtension<PelagicTheme> {
  /// Creates a theme extension from resolved tokens.
  const PelagicTheme({
    required this.colors,
    required this.radii,
    this.mode = pelagicDefaultMode,
    this.accent = pelagicDefaultAccent,
    this.shape = pelagicDefaultShape,
  });

  /// Looks up the generated tokens for [mode] x [accent] and [shape].
  factory PelagicTheme.resolve({
    PelagicMode mode = pelagicDefaultMode,
    PelagicAccent accent = pelagicDefaultAccent,
    PelagicShape shape = pelagicDefaultShape,
  }) {
    return PelagicTheme(
      colors: pelagicColorThemes[mode]![accent]!,
      radii: pelagicShapes[shape]!,
      mode: mode,
      accent: accent,
      shape: shape,
    );
  }

  /// Resolved colors.
  final PelagicColors colors;

  /// Corner radii.
  final PelagicRadii radii;

  /// Color mode these tokens were resolved for.
  final PelagicMode mode;

  /// Accent these tokens were resolved for.
  final PelagicAccent accent;

  /// Shape these tokens were resolved for.
  final PelagicShape shape;

  /// True for the high-contrast mode. Widgets draw thicker borders.
  bool get isHighContrast => mode == PelagicMode.hc;

  /// Width of control borders (2 in high contrast, else 1).
  double get borderWidth => isHighContrast ? 2 : 1;

  /// The Pelagic tokens of the nearest [Theme].
  ///
  /// When the theme was not built with [PelagicThemeData.build], falls back to the
  /// default accent in the light or dark mode matching the theme brightness.
  static PelagicTheme of(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return theme.extension<PelagicTheme>() ??
        PelagicTheme.resolve(
          mode: theme.brightness == Brightness.dark ? PelagicMode.dark : PelagicMode.light,
        );
  }

  /// The Pelagic tokens of the nearest [Theme], or null when none are attached.
  static PelagicTheme? maybeOf(BuildContext context) => Theme.of(context).extension<PelagicTheme>();

  @override
  PelagicTheme copyWith({
    PelagicColors? colors,
    PelagicRadii? radii,
    PelagicMode? mode,
    PelagicAccent? accent,
    PelagicShape? shape,
  }) {
    return PelagicTheme(
      colors: colors ?? this.colors,
      radii: radii ?? this.radii,
      mode: mode ?? this.mode,
      accent: accent ?? this.accent,
      shape: shape ?? this.shape,
    );
  }

  @override
  PelagicTheme lerp(covariant ThemeExtension<PelagicTheme>? other, double t) {
    if (other is! PelagicTheme) return this;
    return PelagicTheme(
      colors: PelagicColors.lerp(colors, other.colors, t),
      radii: PelagicRadii.lerp(radii, other.radii, t),
      mode: t < 0.5 ? mode : other.mode,
      accent: t < 0.5 ? accent : other.accent,
      shape: t < 0.5 ? shape : other.shape,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is PelagicTheme &&
      other.colors == colors &&
      other.radii == radii &&
      other.mode == mode &&
      other.accent == accent &&
      other.shape == shape;

  @override
  int get hashCode => Object.hash(colors, radii, mode, accent, shape);
}

/// Builds Material 3 [ThemeData] wired to the Pelagic tokens.
abstract final class PelagicThemeData {
  /// Resolves a [PelagicThemeMode] against the platform settings in [context].
  ///
  /// [PelagicThemeMode.system] returns [PelagicMode.hc] when the platform asks for
  /// high contrast, otherwise light or dark from the platform brightness.
  static PelagicMode resolveMode(BuildContext context, PelagicThemeMode mode) {
    switch (mode) {
      case PelagicThemeMode.light:
        return PelagicMode.light;
      case PelagicThemeMode.dark:
        return PelagicMode.dark;
      case PelagicThemeMode.hc:
        return PelagicMode.hc;
      case PelagicThemeMode.system:
        if (MediaQuery.maybeHighContrastOf(context) ?? false) return PelagicMode.hc;
        final Brightness brightness =
            MediaQuery.maybePlatformBrightnessOf(context) ?? Brightness.light;
        return brightness == Brightness.dark ? PelagicMode.dark : PelagicMode.light;
    }
  }

  /// A Material 3 theme for one mode x accent x shape, with [PelagicTheme] attached.
  static ThemeData build({
    PelagicMode mode = pelagicDefaultMode,
    PelagicAccent accent = pelagicDefaultAccent,
    PelagicShape shape = pelagicDefaultShape,
    String? fontFamily,
  }) {
    final PelagicTheme pelagic = PelagicTheme.resolve(mode: mode, accent: accent, shape: shape);
    final PelagicColors c = pelagic.colors;
    final PelagicRadii r = pelagic.radii;
    final double bw = pelagic.borderWidth;

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
    const Size minButton = Size(pelagicMinTapTarget, pelagicMinTapTarget);
    const EdgeInsetsGeometry buttonPadding = EdgeInsetsDirectional.symmetric(horizontal: PelagicSpace.lg);

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
      extensions: <ThemeExtension<dynamic>>[pelagic],
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
          horizontal: PelagicSpace.md,
          vertical: PelagicSpace.md,
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
        textStyle: TextStyle(color: c.surface, fontSize: PelagicFontSize.sm),
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

/// Applies a Pelagic theme to a subtree, resolving [PelagicThemeMode.system]
/// against the platform brightness and high-contrast setting.
class PelagicThemeScope extends StatelessWidget {
  /// Creates a theme scope.
  const PelagicThemeScope({
    super.key,
    this.mode = PelagicThemeMode.system,
    this.accent = pelagicDefaultAccent,
    this.shape = pelagicDefaultShape,
    required this.child,
  });

  /// Mode setting.
  final PelagicThemeMode mode;

  /// Accent.
  final PelagicAccent accent;

  /// Shape.
  final PelagicShape shape;

  /// Subtree.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: PelagicThemeData.build(
        mode: PelagicThemeData.resolveMode(context, mode),
        accent: accent,
        shape: shape,
      ),
      child: child,
    );
  }
}

/// A [MaterialApp] preconfigured with Pelagic themes.
///
/// With [mode] set to [PelagicThemeMode.system] (the default) the app follows the
/// platform brightness, and switches to the high-contrast theme when the
/// platform requests it (`MediaQuery.highContrastOf`).
class PelagicApp extends StatelessWidget {
  /// Creates a Pelagic-themed Material app.
  const PelagicApp({
    super.key,
    this.mode = PelagicThemeMode.system,
    this.accent = pelagicDefaultAccent,
    this.shape = pelagicDefaultShape,
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
  final PelagicThemeMode mode;

  /// Accent.
  final PelagicAccent accent;

  /// Shape.
  final PelagicShape shape;

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

  ThemeData _theme(PelagicMode m) =>
      PelagicThemeData.build(mode: m, accent: accent, shape: shape, fontFamily: fontFamily);

  @override
  Widget build(BuildContext context) {
    final ThemeData theme;
    final ThemeData? darkTheme;
    final ThemeData? hcTheme;
    final ThemeMode themeMode;
    switch (mode) {
      case PelagicThemeMode.system:
        theme = _theme(PelagicMode.light);
        darkTheme = _theme(PelagicMode.dark);
        hcTheme = _theme(PelagicMode.hc);
        themeMode = ThemeMode.system;
      case PelagicThemeMode.light:
        theme = _theme(PelagicMode.light);
        darkTheme = null;
        hcTheme = null;
        themeMode = ThemeMode.light;
      case PelagicThemeMode.dark:
        theme = _theme(PelagicMode.dark);
        darkTheme = theme;
        hcTheme = null;
        themeMode = ThemeMode.dark;
      case PelagicThemeMode.hc:
        theme = _theme(PelagicMode.hc);
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
