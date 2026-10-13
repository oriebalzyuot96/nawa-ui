// Verifies the generated tokens (lib/src/tokens.g.dart) against the values the
// web build produces (packages/core/tokens.js) and against the color-mix math.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pelagic_ui/pelagic_ui.dart';

PelagicColors _colors(PelagicMode mode, PelagicAccent accent) => pelagicColorThemes[mode]![accent]!;

void main() {
  group('generated tokens', () {
    test('contain every mode x accent and 3 shapes', () {
      expect(pelagicColorThemes.length, 3);
      for (final PelagicMode mode in PelagicMode.values) {
        expect(pelagicColorThemes[mode]!.length, PelagicAccent.values.length);
      }
      // The core source had 6 accents at first; more may be added, never fewer.
      expect(PelagicAccent.values.length, greaterThanOrEqualTo(6));
      expect(PelagicAccent.values, containsAll(<PelagicAccent>[
        PelagicAccent.teal,
        PelagicAccent.indigo,
        PelagicAccent.rose,
        PelagicAccent.amber,
        PelagicAccent.emerald,
        PelagicAccent.slate,
      ]));
      expect(pelagicShapes.length, 3);
      expect(pelagicShapes[PelagicShape.sharp], const PelagicRadii(sm: 2, md: 4, lg: 6));
      expect(pelagicShapes[PelagicShape.standard], const PelagicRadii(sm: 8, md: 12, lg: 16));
      expect(pelagicShapes[PelagicShape.round], const PelagicRadii(sm: 12, md: 18, lg: 24));
      expect(pelagicSoftMixPrimary, 0.14);
      expect(pelagicSoftMixStatus, 0.12);
    });

    test('light x teal matches the web tokens', () {
      final PelagicColors c = _colors(PelagicMode.light, PelagicAccent.teal);
      expect(c.brightness, Brightness.light);
      expect(c.primary, const Color(0xFF0D7377));
      expect(c.primaryInk, const Color(0xFF0B6B6B));
      expect(c.primarySoft, const Color(0xFFDDEBEC));
      expect(c.surface, const Color(0xFFFFFFFF));
      expect(c.controlBorder, const Color(0xFF768C95));
      expect(c.successSoft, const Color(0xFFE2EDE7));
      expect(c.warningSoft, const Color(0xFFF3E8E0));
      expect(c.dangerSoft, const Color(0xFFF7E5E6));
      expect(c.infoSoft, const Color(0xFFE3EBF6));
      expect(c.overlay, const Color(0x8C0D1418)); // rgba(13, 20, 24, 0.55)
    });

    test('dark x indigo matches the web tokens', () {
      final PelagicColors c = _colors(PelagicMode.dark, PelagicAccent.indigo);
      expect(c.brightness, Brightness.dark);
      expect(c.primary, const Color(0xFFA5B4FC));
      expect(c.onPrimary, const Color(0xFF1E1B4B));
      expect(c.primarySoft, const Color(0xFF252C3B));
      expect(c.surface, const Color(0xFF10161B));
      expect(c.text, const Color(0xFFE7EEF1));
      expect(c.successSoft, const Color(0xFF172D28));
      expect(c.infoSoft, const Color(0xFF1C2936));
      expect(c.overlay, const Color(0xA6000000)); // rgba(0, 0, 0, 0.65)
    });

    test('hc x rose matches the web tokens', () {
      final PelagicColors c = _colors(PelagicMode.hc, PelagicAccent.rose);
      expect(c.brightness, Brightness.light);
      expect(c.primary, const Color(0xFF87001F));
      expect(c.primarySoft, const Color(0xFFEEDBE0));
      expect(c.text, const Color(0xFF000000));
      expect(c.border, const Color(0xFF000000));
      expect(c.dangerSoft, const Color(0xFFF3E0E1));
      expect(c.overlay, const Color(0xBF000000)); // rgba(0, 0, 0, 0.75)
    });

    test('light x amber matches the web tokens', () {
      final PelagicColors c = _colors(PelagicMode.light, PelagicAccent.amber);
      expect(c.primary, const Color(0xFFA34A06));
      expect(c.primarySoft, const Color(0xFFF2E6DC));
    });

    test('soft tints equal color-mix(in srgb) of the source colors', () {
      // (mode, accent, raw primary, raw surface) from packages/core/src/themes.mjs.
      final List<(PelagicMode, PelagicAccent, int, int)> cases = <(PelagicMode, PelagicAccent, int, int)>[
        (PelagicMode.light, PelagicAccent.teal, 0x0D7377, 0xFFFFFF),
        (PelagicMode.dark, PelagicAccent.indigo, 0xA5B4FC, 0x10161B),
        (PelagicMode.hc, PelagicAccent.rose, 0x87001F, 0xFFFFFF),
        (PelagicMode.dark, PelagicAccent.emerald, 0x34D399, 0x10161B),
      ];
      for (final (PelagicMode mode, PelagicAccent accent, int primary, int surface) in cases) {
        expect(
          _colors(mode, accent).primarySoft,
          Color(PelagicColorMath.mixRgb(primary, surface, pelagicSoftMixPrimary)),
          reason: '$mode / $accent primarySoft',
        );
      }
      // Status tint: dark success #4cd987 into #10161b at 12%.
      expect(
        _colors(PelagicMode.dark, PelagicAccent.teal).successSoft,
        Color(PelagicColorMath.mixRgb(0x4CD987, 0x10161B, pelagicSoftMixStatus)),
      );
    });

    test('focus color is the primary color in every theme', () {
      for (final PelagicMode mode in PelagicMode.values) {
        for (final PelagicAccent accent in PelagicAccent.values) {
          expect(_colors(mode, accent).focus, _colors(mode, accent).primary);
        }
      }
    });
  });

  group('PelagicThemeData', () {
    test('build wires the tokens into a Material 3 ThemeData', () {
      final ThemeData theme = PelagicThemeData.build(
        mode: PelagicMode.dark,
        accent: PelagicAccent.indigo,
        shape: PelagicShape.round,
      );
      expect(theme.useMaterial3, isTrue);
      expect(theme.brightness, Brightness.dark);
      expect(theme.colorScheme.primary, const Color(0xFFA5B4FC));
      expect(theme.colorScheme.surface, const Color(0xFF10161B));
      expect(theme.colorScheme.error, const Color(0xFFFF8A8A));
      final PelagicTheme? pelagic = theme.extension<PelagicTheme>();
      expect(pelagic, isNotNull);
      expect(pelagic!.mode, PelagicMode.dark);
      expect(pelagic.accent, PelagicAccent.indigo);
      expect(pelagic.radii.md, 18);
    });

    testWidgets('system mode follows high contrast and platform brightness', (WidgetTester tester) async {
      late PelagicMode resolved;
      Future<void> pumpWith(MediaQueryData data) async {
        await tester.pumpWidget(
          MediaQuery(
            data: data,
            child: Builder(
              builder: (BuildContext context) {
                resolved = PelagicThemeData.resolveMode(context, PelagicThemeMode.system);
                return const SizedBox.shrink();
              },
            ),
          ),
        );
      }

      await pumpWith(const MediaQueryData());
      expect(resolved, PelagicMode.light);
      await pumpWith(const MediaQueryData(platformBrightness: Brightness.dark));
      expect(resolved, PelagicMode.dark);
      await pumpWith(const MediaQueryData(platformBrightness: Brightness.dark, highContrast: true));
      expect(resolved, PelagicMode.hc);
    });

    testWidgets('PelagicTheme.of reads the extension', (WidgetTester tester) async {
      late PelagicTheme pelagic;
      await tester.pumpWidget(
        MaterialApp(
          theme: PelagicThemeData.build(mode: PelagicMode.hc, accent: PelagicAccent.slate),
          home: Builder(
            builder: (BuildContext context) {
              pelagic = PelagicTheme.of(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );
      expect(pelagic.mode, PelagicMode.hc);
      expect(pelagic.isHighContrast, isTrue);
      expect(pelagic.colors.primary, const Color(0xFF000000));
    });
  });
}
