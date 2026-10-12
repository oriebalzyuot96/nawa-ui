import 'package:flutter/material.dart';

import '../tokens.g.dart';
import 'colors.dart';

/// Spacing scale shared with the React Native package.
abstract final class NawaSpace {
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
abstract final class NawaFontSize {
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
const double nawaMinTapTarget = 48;

/// Theme mode setting. [system] follows the platform brightness and the
/// platform high-contrast setting (`MediaQuery.highContrastOf`).
enum NawaThemeMode {
  /// Follow the device: high contrast when requested, else light or dark.
  system,

  /// Always light.
  light,

  /// Always dark.
  dark,

  /// Always high contrast.
  hc,
}

/// Nawa UI design tokens, attached to [ThemeData.extensions].
///
/// Read them with `NawaTheme.of(context)`.
@immutable
class NawaTheme extends ThemeExtension<NawaTheme> {
  /// Creates a theme extension from resolved tokens.
  const NawaTheme({
    required this.colors,
    required this.radii,
    this.mode = nawaDefaultMode,
    this.accent = nawaDefaultAccent,
    this.shape = nawaDefaultShape,
  });

  /// Looks up the generated tokens for [mode] x [accent] and [shape].
  factory NawaTheme.resolve({
    NawaMode mode = nawaDefaultMode,
    NawaAccent accent = nawaDefaultAccent,
    NawaShape shape = nawaDefaultShape,
  }) {
    return NawaTheme(
      colors: nawaColorThemes[mode]![accent]!,
      radii: nawaShapes[shape]!,
      mode: mode,
      accent: accent,
      shape: shape,
    );
  }

  /// Resolved colors.
  final NawaColors colors;

  /// Corner radii.
  final NawaRadii radii;

  /// Color mode these tokens were resolved for.
  final NawaMode mode;

  /// Accent these tokens were resolved for.
  final NawaAccent accent;

  /// Shape these tokens were resolved for.
  final NawaShape shape;

  /// True for the high-contrast mode. Widgets draw thicker borders.
  bool get isHighContrast => mode == NawaMode.hc;

  /// Width of control borders (2 in high contrast, else 1).
  double get borderWidth => isHighContrast ? 2 : 1;

  /// The Nawa tokens of the nearest [Theme].
  ///
  /// When the theme was not built with [NawaThemeData.build], falls back to the
  /// default accent in the light or dark mode matching the theme brightness.
  static NawaTheme of(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return theme.extension<NawaTheme>() ??
        NawaTheme.resolve(
          mode: theme.brightness == Brightness.dark ? NawaMode.dark : NawaMode.light,
        );
  }

  /// The Nawa tokens of the nearest [Theme], or null when none are attached.
  static NawaTheme? maybeOf(BuildContext context) => Theme.of(context).extension<NawaTheme>();

  @override
  NawaTheme copyWith({
    NawaColors? colors,
    NawaRadii? radii,
    NawaMode? mode,
    NawaAccent? accent,
    NawaShape? shape,
  }) {
    return NawaTheme(
      colors: colors ?? this.colors,
      radii: radii ?? this.radii,
      mode: mode ?? this.mode,
      accent: accent ?? this.accent,
      shape: shape ?? this.shape,
    );
  }

  @override
  NawaTheme lerp(covariant ThemeExtension<NawaTheme>? other, double t) {
    if (other is! NawaTheme) return this;
    return NawaTheme(
      colors: NawaColors.lerp(colors, other.colors, t),
      radii: NawaRadii.lerp(radii, other.radii, t),
      mode: t < 0.5 ? mode : other.mode,
      accent: t < 0.5 ? accent : other.accent,
      shape: t < 0.5 ? shape : other.shape,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is NawaTheme &&
      other.colors == colors &&
      other.radii == radii &&
      other.mode == mode &&
      other.accent == accent &&
      other.shape == shape;

  @override
  int get hashCode => Object.hash(colors, radii, mode, accent, shape);
}

/// Builds Material 3 [ThemeData] wired to the Nawa tokens.
abstract final class NawaThemeData {
  /// Resolves a [NawaThemeMode] against the platform settings in [context].
  ///
  /// [NawaThemeMode.system] returns [NawaMode.hc] when the platform asks for
  /// high contrast, otherwise light or dark from the platform brightness.
  static NawaMode resolveMode(BuildContext context, NawaThemeMode mode) {
    switch (mode) {
      case NawaThemeMode.light:
        return NawaMode.light;
      case NawaThemeMode.dark:
        return NawaMode.dark;
      case NawaThemeMode.hc:
        return NawaMode.hc;
      case NawaThemeMode.system:
        if (MediaQuery.maybeHighContrastOf(context) ?? false) return NawaMode.hc;
        final Brightness brightness =
            MediaQuery.maybePlatformBrightnessOf(context) ?? Brightness.light;
        return brightness == Brightness.dark ? NawaMode.dark : NawaMode.light;
    }
  }

  /// A Material 3 theme for one mode x accent x shape, with [NawaTheme] attached.
  static ThemeData build({
    NawaMode mode = nawaDefaultMode,
    NawaAccent accent = nawaDefaultAccent,
    NawaShape shape = nawaDefaultShape,
    String? fontFamily,
  }) {
    final NawaTheme nawa = NawaTheme.resolve(mode: mode, accent: accent, shape: shape);
    final NawaColors c = nawa.colors;
    final NawaRadii r = nawa.radii;
    final double bw = nawa.borderWidth;

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
    const Size minButton = Size(nawaMinTapTarget, nawaMinTapTarget);
    const EdgeInsetsGeometry buttonPadding = EdgeInsetsDirectional.symmetric(horizontal: NawaSpace.lg);

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
      extensions: <ThemeExtension<dynamic>>[nawa],
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
          horizontal: NawaSpace.md,
          vertical: NawaSpace.md,
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
        textStyle: TextStyle(color: c.surface, fontSize: NawaFontSize.sm),
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

/// Applies a Nawa theme to a subtree, resolving [NawaThemeMode.system]
/// against the platform brightness and high-contrast setting.
class NawaThemeScope extends StatelessWidget {
  /// Creates a theme scope.
  const NawaThemeScope({
    super.key,
    this.mode = NawaThemeMode.system,
    this.accent = nawaDefaultAccent,
    this.shape = nawaDefaultShape,
    required this.child,
  });

  /// Mode setting.
  final NawaThemeMode mode;

  /// Accent.
  final NawaAccent accent;

  /// Shape.
  final NawaShape shape;

  /// Subtree.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: NawaThemeData.build(
        mode: NawaThemeData.resolveMode(context, mode),
        accent: accent,
        shape: shape,
      ),
      child: child,
    );
  }
}

/// A [MaterialApp] preconfigured with Nawa themes.
///
/// With [mode] set to [NawaThemeMode.system] (the default) the app follows the
/// platform brightness, and switches to the high-contrast theme when the
/// platform requests it (`MediaQuery.highContrastOf`).
class NawaApp extends StatelessWidget {
  /// Creates a Nawa-themed Material app.
  const NawaApp({
    super.key,
    this.mode = NawaThemeMode.system,
    this.accent = nawaDefaultAccent,
    this.shape = nawaDefaultShape,
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
  final NawaThemeMode mode;

  /// Accent.
  final NawaAccent accent;

  /// Shape.
  final NawaShape shape;

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

  ThemeData _theme(NawaMode m) =>
      NawaThemeData.build(mode: m, accent: accent, shape: shape, fontFamily: fontFamily);

  @override
  Widget build(BuildContext context) {
    final ThemeData theme;
    final ThemeData? darkTheme;
    final ThemeData? hcTheme;
    final ThemeMode themeMode;
    switch (mode) {
      case NawaThemeMode.system:
        theme = _theme(NawaMode.light);
        darkTheme = _theme(NawaMode.dark);
        hcTheme = _theme(NawaMode.hc);
        themeMode = ThemeMode.system;
      case NawaThemeMode.light:
        theme = _theme(NawaMode.light);
        darkTheme = null;
        hcTheme = null;
        themeMode = ThemeMode.light;
      case NawaThemeMode.dark:
        theme = _theme(NawaMode.dark);
        darkTheme = theme;
        hcTheme = null;
        themeMode = ThemeMode.dark;
      case NawaThemeMode.hc:
        theme = _theme(NawaMode.hc);
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
