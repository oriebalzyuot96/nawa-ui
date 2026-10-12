// Verifies the generated tokens (lib/src/tokens.g.dart) against the values the
// web build produces (packages/core/tokens.js) and against the color-mix math.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nawa_ui/nawa_ui.dart';

NawaColors _colors(NawaMode mode, NawaAccent accent) => nawaColorThemes[mode]![accent]!;

void main() {
  group('generated tokens', () {
    test('contain every mode x accent and 3 shapes', () {
      expect(nawaColorThemes.length, 3);
      for (final NawaMode mode in NawaMode.values) {
        expect(nawaColorThemes[mode]!.length, NawaAccent.values.length);
      }
      // The core source had 6 accents at first; more may be added, never fewer.
      expect(NawaAccent.values.length, greaterThanOrEqualTo(6));
      expect(NawaAccent.values, containsAll(<NawaAccent>[
        NawaAccent.teal,
        NawaAccent.indigo,
        NawaAccent.rose,
        NawaAccent.amber,
        NawaAccent.emerald,
        NawaAccent.slate,
      ]));
      expect(nawaShapes.length, 3);
      expect(nawaShapes[NawaShape.sharp], const NawaRadii(sm: 2, md: 4, lg: 6));
      expect(nawaShapes[NawaShape.standard], const NawaRadii(sm: 8, md: 12, lg: 16));
      expect(nawaShapes[NawaShape.round], const NawaRadii(sm: 12, md: 18, lg: 24));
      expect(nawaSoftMixPrimary, 0.14);
      expect(nawaSoftMixStatus, 0.12);
    });

    test('light x teal matches the web tokens', () {
      final NawaColors c = _colors(NawaMode.light, NawaAccent.teal);
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
      final NawaColors c = _colors(NawaMode.dark, NawaAccent.indigo);
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
      final NawaColors c = _colors(NawaMode.hc, NawaAccent.rose);
      expect(c.brightness, Brightness.light);
      expect(c.primary, const Color(0xFF87001F));
      expect(c.primarySoft, const Color(0xFFEEDBE0));
      expect(c.text, const Color(0xFF000000));
      expect(c.border, const Color(0xFF000000));
      expect(c.dangerSoft, const Color(0xFFF3E0E1));
      expect(c.overlay, const Color(0xBF000000)); // rgba(0, 0, 0, 0.75)
    });

    test('light x amber matches the web tokens', () {
      final NawaColors c = _colors(NawaMode.light, NawaAccent.amber);
      expect(c.primary, const Color(0xFFA34A06));
      expect(c.primarySoft, const Color(0xFFF2E6DC));
    });

    test('soft tints equal color-mix(in srgb) of the source colors', () {
      // (mode, accent, raw primary, raw surface) from packages/core/src/themes.mjs.
      final List<(NawaMode, NawaAccent, int, int)> cases = <(NawaMode, NawaAccent, int, int)>[
        (NawaMode.light, NawaAccent.teal, 0x0D7377, 0xFFFFFF),
        (NawaMode.dark, NawaAccent.indigo, 0xA5B4FC, 0x10161B),
        (NawaMode.hc, NawaAccent.rose, 0x87001F, 0xFFFFFF),
        (NawaMode.dark, NawaAccent.emerald, 0x34D399, 0x10161B),
      ];
      for (final (NawaMode mode, NawaAccent accent, int primary, int surface) in cases) {
        expect(
          _colors(mode, accent).primarySoft,
          Color(NawaColorMath.mixRgb(primary, surface, nawaSoftMixPrimary)),
          reason: '$mode / $accent primarySoft',
        );
      }
      // Status tint: dark success #4cd987 into #10161b at 12%.
      expect(
        _colors(NawaMode.dark, NawaAccent.teal).successSoft,
        Color(NawaColorMath.mixRgb(0x4CD987, 0x10161B, nawaSoftMixStatus)),
      );
    });

    test('focus color is the primary color in every theme', () {
      for (final NawaMode mode in NawaMode.values) {
        for (final NawaAccent accent in NawaAccent.values) {
          expect(_colors(mode, accent).focus, _colors(mode, accent).primary);
        }
      }
    });
  });

  group('NawaThemeData', () {
    test('build wires the tokens into a Material 3 ThemeData', () {
      final ThemeData theme = NawaThemeData.build(
        mode: NawaMode.dark,
        accent: NawaAccent.indigo,
        shape: NawaShape.round,
      );
      expect(theme.useMaterial3, isTrue);
      expect(theme.brightness, Brightness.dark);
      expect(theme.colorScheme.primary, const Color(0xFFA5B4FC));
      expect(theme.colorScheme.surface, const Color(0xFF10161B));
      expect(theme.colorScheme.error, const Color(0xFFFF8A8A));
      final NawaTheme? nawa = theme.extension<NawaTheme>();
      expect(nawa, isNotNull);
      expect(nawa!.mode, NawaMode.dark);
      expect(nawa.accent, NawaAccent.indigo);
      expect(nawa.radii.md, 18);
    });

    testWidgets('system mode follows high contrast and platform brightness', (WidgetTester tester) async {
      late NawaMode resolved;
      Future<void> pumpWith(MediaQueryData data) async {
        await tester.pumpWidget(
          MediaQuery(
            data: data,
            child: Builder(
              builder: (BuildContext context) {
                resolved = NawaThemeData.resolveMode(context, NawaThemeMode.system);
                return const SizedBox.shrink();
              },
            ),
          ),
        );
      }

      await pumpWith(const MediaQueryData());
      expect(resolved, NawaMode.light);
      await pumpWith(const MediaQueryData(platformBrightness: Brightness.dark));
      expect(resolved, NawaMode.dark);
      await pumpWith(const MediaQueryData(platformBrightness: Brightness.dark, highContrast: true));
      expect(resolved, NawaMode.hc);
    });

    testWidgets('NawaTheme.of reads the extension', (WidgetTester tester) async {
      late NawaTheme nawa;
      await tester.pumpWidget(
        MaterialApp(
          theme: NawaThemeData.build(mode: NawaMode.hc, accent: NawaAccent.slate),
          home: Builder(
            builder: (BuildContext context) {
              nawa = NawaTheme.of(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );
      expect(nawa.mode, NawaMode.hc);
      expect(nawa.isHighContrast, isTrue);
      expect(nawa.colors.primary, const Color(0xFF000000));
    });
  });
}
