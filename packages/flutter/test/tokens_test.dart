// Verifies the generated tokens (lib/src/tokens.g.dart) against the values the
// web build produces (packages/core/tokens.js) and against the color-mix math.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orca_ui/orca_ui.dart';

OrcaColors _colors(OrcaMode mode, OrcaAccent accent) => orcaColorThemes[mode]![accent]!;

void main() {
  group('generated tokens', () {
    test('contain every mode x accent and 3 shapes', () {
      expect(orcaColorThemes.length, 3);
      for (final OrcaMode mode in OrcaMode.values) {
        expect(orcaColorThemes[mode]!.length, OrcaAccent.values.length);
      }
      // The core source had 6 accents at first; more may be added, never fewer.
      expect(OrcaAccent.values.length, greaterThanOrEqualTo(6));
      expect(OrcaAccent.values, containsAll(<OrcaAccent>[
        OrcaAccent.teal,
        OrcaAccent.indigo,
        OrcaAccent.rose,
        OrcaAccent.amber,
        OrcaAccent.emerald,
        OrcaAccent.slate,
      ]));
      expect(orcaShapes.length, 3);
      expect(orcaShapes[OrcaShape.sharp], const OrcaRadii(sm: 2, md: 4, lg: 6));
      expect(orcaShapes[OrcaShape.standard], const OrcaRadii(sm: 8, md: 12, lg: 16));
      expect(orcaShapes[OrcaShape.round], const OrcaRadii(sm: 12, md: 18, lg: 24));
      expect(orcaSoftMixPrimary, 0.14);
      expect(orcaSoftMixStatus, 0.12);
    });

    test('light x teal matches the web tokens', () {
      final OrcaColors c = _colors(OrcaMode.light, OrcaAccent.teal);
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
      final OrcaColors c = _colors(OrcaMode.dark, OrcaAccent.indigo);
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
      final OrcaColors c = _colors(OrcaMode.hc, OrcaAccent.rose);
      expect(c.brightness, Brightness.light);
      expect(c.primary, const Color(0xFF87001F));
      expect(c.primarySoft, const Color(0xFFEEDBE0));
      expect(c.text, const Color(0xFF000000));
      expect(c.border, const Color(0xFF000000));
      expect(c.dangerSoft, const Color(0xFFF3E0E1));
      expect(c.overlay, const Color(0xBF000000)); // rgba(0, 0, 0, 0.75)
    });

    test('light x amber matches the web tokens', () {
      final OrcaColors c = _colors(OrcaMode.light, OrcaAccent.amber);
      expect(c.primary, const Color(0xFFA34A06));
      expect(c.primarySoft, const Color(0xFFF2E6DC));
    });

    test('soft tints equal color-mix(in srgb) of the source colors', () {
      // (mode, accent, raw primary, raw surface) from packages/core/src/themes.mjs.
      final List<(OrcaMode, OrcaAccent, int, int)> cases = <(OrcaMode, OrcaAccent, int, int)>[
        (OrcaMode.light, OrcaAccent.teal, 0x0D7377, 0xFFFFFF),
        (OrcaMode.dark, OrcaAccent.indigo, 0xA5B4FC, 0x10161B),
        (OrcaMode.hc, OrcaAccent.rose, 0x87001F, 0xFFFFFF),
        (OrcaMode.dark, OrcaAccent.emerald, 0x34D399, 0x10161B),
      ];
      for (final (OrcaMode mode, OrcaAccent accent, int primary, int surface) in cases) {
        expect(
          _colors(mode, accent).primarySoft,
          Color(OrcaColorMath.mixRgb(primary, surface, orcaSoftMixPrimary)),
          reason: '$mode / $accent primarySoft',
        );
      }
      // Status tint: dark success #4cd987 into #10161b at 12%.
      expect(
        _colors(OrcaMode.dark, OrcaAccent.teal).successSoft,
        Color(OrcaColorMath.mixRgb(0x4CD987, 0x10161B, orcaSoftMixStatus)),
      );
    });

    test('focus color is the primary color in every theme', () {
      for (final OrcaMode mode in OrcaMode.values) {
        for (final OrcaAccent accent in OrcaAccent.values) {
          expect(_colors(mode, accent).focus, _colors(mode, accent).primary);
        }
      }
    });
  });

  group('OrcaThemeData', () {
    test('build wires the tokens into a Material 3 ThemeData', () {
      final ThemeData theme = OrcaThemeData.build(
        mode: OrcaMode.dark,
        accent: OrcaAccent.indigo,
        shape: OrcaShape.round,
      );
      expect(theme.useMaterial3, isTrue);
      expect(theme.brightness, Brightness.dark);
      expect(theme.colorScheme.primary, const Color(0xFFA5B4FC));
      expect(theme.colorScheme.surface, const Color(0xFF10161B));
      expect(theme.colorScheme.error, const Color(0xFFFF8A8A));
      final OrcaTheme? orca = theme.extension<OrcaTheme>();
      expect(orca, isNotNull);
      expect(orca!.mode, OrcaMode.dark);
      expect(orca.accent, OrcaAccent.indigo);
      expect(orca.radii.md, 18);
    });

    testWidgets('system mode follows high contrast and platform brightness', (WidgetTester tester) async {
      late OrcaMode resolved;
      Future<void> pumpWith(MediaQueryData data) async {
        await tester.pumpWidget(
          MediaQuery(
            data: data,
            child: Builder(
              builder: (BuildContext context) {
                resolved = OrcaThemeData.resolveMode(context, OrcaThemeMode.system);
                return const SizedBox.shrink();
              },
            ),
          ),
        );
      }

      await pumpWith(const MediaQueryData());
      expect(resolved, OrcaMode.light);
      await pumpWith(const MediaQueryData(platformBrightness: Brightness.dark));
      expect(resolved, OrcaMode.dark);
      await pumpWith(const MediaQueryData(platformBrightness: Brightness.dark, highContrast: true));
      expect(resolved, OrcaMode.hc);
    });

    testWidgets('OrcaTheme.of reads the extension', (WidgetTester tester) async {
      late OrcaTheme orca;
      await tester.pumpWidget(
        MaterialApp(
          theme: OrcaThemeData.build(mode: OrcaMode.hc, accent: OrcaAccent.slate),
          home: Builder(
            builder: (BuildContext context) {
              orca = OrcaTheme.of(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );
      expect(orca.mode, OrcaMode.hc);
      expect(orca.isHighContrast, isTrue);
      expect(orca.colors.primary, const Color(0xFF000000));
    });
  });
}
